import { spawn, type ChildProcess } from "node:child_process";
import { createConnection, createServer, type Server, type Socket } from "node:net";
import type { Config } from "./config.js";
import { EXTERNAL_SNAPCAST_NODE } from "./pipewire.js";
import { makeLog } from "./log.js";
import type { ExternalSnapcastStatus } from "./wire-contract.js";

const log = makeLog("snapcast-external");

// ~1.4s of 48000:16:2 PCM. A peer that falls further behind than this drops audio
// rather than growing our memory without bound.
const DROP_BYTES = 256 * 1024;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 30_000;
const CAPTURE_RESTART_MS = 2_000;

export const PW_RECORD_ARGS = [
  "--raw", "--target", "0",
  "-P", `{ node.name = ${EXTERNAL_SNAPCAST_NODE} node.autoconnect = false }`,
  "--rate", "48000", "--channels", "2", "--format", "s16", "-",
];

export type CaptureSpawner = () => ChildProcess;

const defaultSpawn: CaptureSpawner = () =>
  spawn("pw-record", PW_RECORD_ARGS, {
    env: { ...process.env, XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR || "/run/pipewire" },
    stdio: ["ignore", "pipe", "ignore"],
  });

function offStatus(): ExternalSnapcastStatus {
  return { mode: "off", capturing: false, connected: false, clients: 0, lastError: null };
}

// Feeds Soloist's audio to an external Snapserver's tcp:// source. A pw-record capture
// node (linked from soloist-sink:monitor by reconcileOutputs, like any Audio Output)
// yields raw PCM, which we either push to host:port or serve on port for the external
// server to pull.
export class ExternalSnapcast {
  status: ExternalSnapcastStatus = offStatus();
  private key = "";
  private gen = 0;
  private child: ChildProcess | null = null;
  private socket: Socket | null = null;
  private server: Server | null = null;
  private clients = new Set<Socket>();
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private cfg: Config,
    private relink: () => void,
    private spawnCapture: CaptureSpawner = defaultSpawn,
  ) {}

  apply(): void {
    const e = this.cfg.audio.externalSnapcast;
    const key = `${e.mode}|${e.host}|${e.port}`;
    if (key === this.key) return;
    this.teardown();
    this.key = key;
    this.status = { ...offStatus(), mode: e.mode };
    if (e.mode === "off") return;
    if (e.mode === "push" && !e.host) {
      this.status.lastError = "Push mode needs a host";
      return;
    }
    const gen = this.gen;
    this.startCapture(gen);
    if (e.mode === "push") this.dial(gen, e.host, e.port, BACKOFF_BASE_MS);
    else this.listen(gen, e.port, BACKOFF_BASE_MS);
  }

  stop(): void {
    this.key = "";
    this.teardown();
    this.status = offStatus();
  }

  private teardown(): void {
    this.gen++;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    this.child?.kill();
    this.child = null;
    this.socket?.destroy();
    this.socket = null;
    for (const c of this.clients) c.destroy();
    this.clients.clear();
    this.server?.close();
    this.server = null;
  }

  private later(gen: number, ms: number, fn: () => void): void {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (gen === this.gen) fn();
    }, ms);
    t.unref?.();
    this.timers.add(t);
  }

  private startCapture(gen: number): void {
    const child = this.spawnCapture();
    this.child = child;
    this.status.capturing = true;
    child.stdout?.on("data", (chunk: Buffer) => this.write(chunk));
    child.on("error", (err) => {
      if (gen !== this.gen) return;
      this.status.lastError = `capture failed: ${err.message}`;
      log.error("pw-record spawn failed: %s", err.message);
    });
    // "close", not "exit": a failed spawn emits error + close but never exit.
    child.on("close", (code) => {
      if (gen !== this.gen) return;
      this.child = null;
      this.status.capturing = false;
      log.warn("pw-record stopped (%s); restarting in %dms", code, CAPTURE_RESTART_MS);
      this.later(gen, CAPTURE_RESTART_MS, () => this.startCapture(gen));
    });
    // The new capture node has no links yet; reconcile waits for its ports to appear.
    this.relink();
  }

  private write(chunk: Buffer): void {
    const s = this.socket;
    if (s && !s.connecting && !s.destroyed && s.writableLength < DROP_BYTES) s.write(chunk);
    for (const c of this.clients) if (c.writableLength < DROP_BYTES) c.write(chunk);
  }

  private dial(gen: number, host: string, port: number, backoffMs: number): void {
    const sock = createConnection({ host, port });
    this.socket = sock;
    sock.setKeepAlive(true, 10_000);
    sock.on("connect", () => {
      if (gen !== this.gen) return;
      this.status.connected = true;
      this.status.lastError = null;
      backoffMs = BACKOFF_BASE_MS;
      log("pushing audio to %s:%d", host, port);
    });
    sock.on("error", (err) => {
      if (gen !== this.gen) return;
      this.status.lastError = err.message;
      log.error("%s:%d error: %s", host, port, err.message);
    });
    sock.on("close", () => {
      if (gen !== this.gen) return;
      this.socket = null;
      this.status.connected = false;
      this.later(gen, backoffMs, () => this.dial(gen, host, port, Math.min(backoffMs * 2, BACKOFF_MAX_MS)));
    });
  }

  private listen(gen: number, port: number, backoffMs: number): void {
    const server = createServer((sock) => {
      this.clients.add(sock);
      this.status.clients = this.clients.size;
      log("snapserver %s connected", sock.remoteAddress);
      sock.on("error", () => {});
      sock.on("close", () => {
        this.clients.delete(sock);
        this.status.clients = this.clients.size;
      });
    });
    server.on("error", (err) => {
      if (gen !== this.gen) return;
      this.status.lastError = err.message;
      log.error("listen on %d failed: %s; retrying in %dms", port, err.message, backoffMs);
      server.close();
      if (this.server === server) this.server = null;
      this.later(gen, backoffMs, () => this.listen(gen, port, Math.min(backoffMs * 2, BACKOFF_MAX_MS)));
    });
    server.listen(port, "0.0.0.0", () => {
      if (gen === this.gen) this.status.lastError = null;
      log("serving audio on port %d", port);
    });
    this.server = server;
  }
}
