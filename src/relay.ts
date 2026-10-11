import { createHmac } from "node:crypto";
import { WebSocket, type RawData } from "ws";
import type { Config } from "./config.js";
import type { SoloistHub, UpstreamFrame } from "./hub.js";
import { deferred } from "./util.js";
import { reconnectLoop } from "./reconnect.js";
import { makeLog } from "./log.js";
import type { RelayStatus } from "./wire-contract.js";

const log = makeLog("relay");

const RELAY_BACKOFF_BASE = 0.5;
const RELAY_BACKOFF_MAX = 30.0;

export type { RelayStatus } from "./wire-contract.js";

// Pusher only rebroadcasts client-sent events named client-*, and Reverb (default
// accept_client_events_from: members) only from a connection subscribed to the channel.
export function pusherEnvelope(frame: UpstreamFrame, channel: string): string {
  return JSON.stringify({ event: `client-${frame.type}`, channel, data: frame.message });
}

export function needsPusherAuth(channel: string): boolean {
  return channel.startsWith("private-") || channel.startsWith("presence-");
}

export function pusherSubscribe(channel: string, socketId: string, appKey: string, appSecret: string): string {
  if (!needsPusherAuth(channel)) return JSON.stringify({ event: "pusher:subscribe", data: { channel } });
  const channelData = channel.startsWith("presence-") ? JSON.stringify({ user_id: `soloist-${socketId}` }) : undefined;
  const toSign = channelData ? `${socketId}:${channel}:${channelData}` : `${socketId}:${channel}`;
  const auth = `${appKey}:${createHmac("sha256", appSecret).update(toSign).digest("hex")}`;
  return JSON.stringify({ event: "pusher:subscribe", data: channelData ? { channel, auth, channel_data: channelData } : { channel, auth } });
}

export type PusherInbound =
  | { kind: "connected"; socketId: string }
  | { kind: "subscribed"; channel: string }
  | { kind: "ping" }
  | { kind: "error"; message: string }
  | { kind: "ignore" }
  | { kind: "event"; channel: string; payload: string };

// Protocol events (pusher:* / pusher_internal:*) are handled here and never reach
// Soloist; any other event has its `data` unwrapped (Pusher servers send it as a
// JSON string, whispers arrive as an object) and forwarded upstream.
export function parsePusherInbound(raw: string): PusherInbound {
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return { kind: "ignore" };
  }
  if (!msg || typeof msg !== "object" || Array.isArray(msg)) return { kind: "ignore" };
  const { event, channel, data } = msg as Record<string, unknown>;
  if (typeof event !== "string") return { kind: "ignore" };
  const ch = typeof channel === "string" ? channel : "";
  if (event === "pusher:connection_established") return { kind: "connected", socketId: pusherSocketId(data) };
  if (event === "pusher_internal:subscription_succeeded") return { kind: "subscribed", channel: ch };
  if (event === "pusher:ping") return { kind: "ping" };
  if (event === "pusher:error") return { kind: "error", message: pusherErrorText(data) };
  if (event.startsWith("pusher:") || event.startsWith("pusher_internal:")) return { kind: "ignore" };
  if (data == null) return { kind: "ignore" };
  return { kind: "event", channel: ch, payload: typeof data === "string" ? data : JSON.stringify(data) };
}

function pusherSocketId(data: unknown): string {
  let d = data;
  if (typeof d === "string") {
    try { d = JSON.parse(d); } catch { return ""; }
  }
  const id = (d as { socket_id?: unknown } | null)?.socket_id;
  return typeof id === "string" ? id : "";
}

function pusherErrorText(data: unknown): string {
  let d = data;
  if (typeof d === "string") {
    try { d = JSON.parse(d); } catch { return d as string; }
  }
  const { code, message } = (d ?? {}) as { code?: unknown; message?: unknown };
  return `pusher error ${code ?? "?"}: ${message ?? "unknown"}`;
}

export class SoloistRelay {
  private conn: WebSocket | null = null;
  private stopped = false;
  private wake = deferred();
  private appliedUrl: string;
  private appliedAuth: string;
  private appliedPusher: boolean;
  private appliedChannel: string;
  private appliedAppKey: string;
  private appliedAppSecret: string;
  private subscribed = false;
  readonly status: RelayStatus = { enabled: false, connected: false, lastConnectAt: null, lastError: null };

  constructor(hub: SoloistHub, private cfg: Config) {
    this.appliedUrl = cfg.relay.url;
    this.appliedAuth = cfg.relay.authorization;
    this.appliedPusher = cfg.relay.pusher;
    this.appliedChannel = cfg.relay.channel;
    this.appliedAppKey = cfg.relay.appKey;
    this.appliedAppSecret = cfg.relay.appSecret;
    hub.observe((frame) => {
      const c = this.conn;
      if (!c || c.readyState !== WebSocket.OPEN) return;
      if (!this.appliedPusher) return c.send(frame.raw);
      if (this.subscribed) c.send(pusherEnvelope(frame, this.appliedChannel));
    });
    // Inbound: raw bytes straight upstream, transparent — the Relay Server is a
    // full-control peer. In Pusher mode the envelope is stripped first.
    this.onMessage = (data, isBinary) => {
      if (!this.appliedPusher) return hub.sendUpstream(data, isBinary);
      if (isBinary) return;
      const msg = parsePusherInbound(data.toString());
      const c = this.conn;
      if (msg.kind === "connected") {
        c?.send(pusherSubscribe(this.appliedChannel, msg.socketId, this.appliedAppKey, this.appliedAppSecret));
      } else if (msg.kind === "subscribed") {
        if (msg.channel === this.appliedChannel) {
          this.subscribed = true;
          log("relay subscribed to pusher channel %s", msg.channel);
        }
      } else if (msg.kind === "ping") {
        c?.send(JSON.stringify({ event: "pusher:pong" }));
      } else if (msg.kind === "error") {
        this.status.lastError = msg.message;
        log.error("relay %s", msg.message);
      } else if (msg.kind === "event" && msg.channel === this.appliedChannel) {
        hub.sendUpstream(Buffer.from(msg.payload), false);
      }
    };
  }

  private onMessage: (data: RawData, isBinary: boolean) => void;

  private signal(): void {
    this.wake.resolve();
    this.wake = deferred();
  }

  // Re-dial only if a relay field actually changed, so an unrelated config save
  // never needlessly drops a healthy relay connection.
  apply(): void {
    const r = this.cfg.relay;
    if (
      r.url === this.appliedUrl &&
      r.authorization === this.appliedAuth &&
      r.pusher === this.appliedPusher &&
      r.channel === this.appliedChannel &&
      r.appKey === this.appliedAppKey &&
      r.appSecret === this.appliedAppSecret
    ) return;
    this.appliedUrl = r.url;
    this.appliedAuth = r.authorization;
    this.appliedPusher = r.pusher;
    this.appliedChannel = r.channel;
    this.appliedAppKey = r.appKey;
    this.appliedAppSecret = r.appSecret;
    this.conn?.close();
    this.signal();
  }

  stop(): void {
    this.stopped = true;
    this.conn?.close();
    this.signal();
  }

  async run(): Promise<void> {
    // Resolved fresh in connect() (not hoisted) so it always reflects the url used to
    // open the connection this iteration, even if apply() changes it mid-loop.
    let currentUrl = "";
    await reconnectLoop({
      backoffBase: RELAY_BACKOFF_BASE,
      backoffMax: RELAY_BACKOFF_MAX,
      isStopped: () => this.stopped,
      getWake: () => this.wake,
      shouldDial: () => {
        const url = this.cfg.relay.url;
        this.status.enabled = url !== "";
        if (!url) {
          this.status.connected = false;
          return false;
        }
        if (this.cfg.relay.pusher && !this.cfg.relay.channel) {
          this.status.connected = false;
          this.status.lastError = "Pusher mode needs a channel";
          return false;
        }
        if (this.cfg.relay.pusher && needsPusherAuth(this.cfg.relay.channel) && !(this.cfg.relay.appKey && this.cfg.relay.appSecret)) {
          this.status.connected = false;
          this.status.lastError = "Private and presence channels need the app key and secret";
          return false;
        }
        return true;
      },
      connect: () => {
        currentUrl = this.cfg.relay.url;
        const headers: Record<string, string> = {};
        if (this.cfg.relay.authorization) headers.authorization = this.cfg.relay.authorization;
        return new WebSocket(currentUrl, { headers });
      },
      onOpen: (conn) => {
        log("relay connected to %s", currentUrl);
        this.conn = conn;
        this.subscribed = false;
        this.status.connected = true;
        this.status.lastConnectAt = Date.now();
        this.status.lastError = null;
      },
      onMessage: (data, isBinary) => this.onMessage(data, isBinary),
      onError: (err) => {
        this.status.lastError = err.message;
        log.error("relay %s error: %s", currentUrl, err.message);
      },
      onSettled: () => {
        this.conn = null;
        this.status.connected = false;
      },
    });
  }
}
