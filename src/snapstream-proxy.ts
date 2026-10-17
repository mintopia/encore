import { connect } from "node:net";
import { createHmac, randomUUID } from "node:crypto";
import { request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { makeLog } from "./log.js";
import { safeStrEqual } from "./util.js";

const log = makeLog("snapstream");

export const SNAPSTREAM_PATH = "/stream";
export const SNAPSERVER_HTTP_PORT = 1780;

const DROPPED_HEADERS = new Set(["cookie", "authorization"]);

export function buildUpstreamRequest(req: IncomingMessage, port: number): string {
  const lines = [`GET ${SNAPSTREAM_PATH} HTTP/1.1`, `Host: 127.0.0.1:${port}`];
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    const name = req.rawHeaders[i]!;
    if (name.toLowerCase() === "host" || DROPPED_HEADERS.has(name.toLowerCase())) continue;
    lines.push(`${name}: ${req.rawHeaders[i + 1]!.replace(/[\r\n]/g, " ")}`);
  }
  return lines.join("\r\n") + "\r\n\r\n";
}

export function proxyStreamUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer, port: number = SNAPSERVER_HTTP_PORT): void {
  const upstream = connect(port, "127.0.0.1");
  const fail = () => {
    if (socket.writable) socket.write("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\nSnapcast unavailable\n");
    socket.destroy();
  };
  const onConnectError = (e: Error) => {
    log.warn("snapserver /stream unreachable: %s", e.message);
    fail();
  };
  upstream.once("connect", () => {
    upstream.removeListener("error", onConnectError);
    upstream.on("error", () => socket.destroy());
    upstream.write(buildUpstreamRequest(req, port));
    if (head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.once("error", onConnectError);
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
  upstream.on("close", () => socket.destroy());
}

export const LISTENER_IDENTITY_PATH = "/listen/identity";
export const JSONRPC_PATH = "/jsonrpc";
export const LISTENER_ID_HEADER = "x-encore-listener";
const MAX_RPC_BODY = 2048;

function idMac(uuid: string, secret: string): string {
  return createHmac("sha256", secret).update("listener-id\0").update(uuid).digest("base64url").slice(0, 22);
}

export function mintListenerId(secret: string): string {
  const uuid = randomUUID();
  return `${uuid}.${idMac(uuid, secret)}`;
}

export function validListenerId(id: unknown, secret: string): boolean {
  if (typeof id !== "string") return false;
  const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{22})$/.exec(id);
  return !!m && safeStrEqual(m[2]!, idMac(m[1]!, secret));
}

export function listenerName(req: IncomingMessage): string {
  const ip = (req.socket.remoteAddress ?? "unknown").replace(/^::ffff:/, "");
  return `Encore Listener \u2014 ${ip}`;
}

export function scopeSetVolume(body: string, ownId: string): string | null {
  let j: any;
  try { j = JSON.parse(body); } catch { return null; }
  if (!j || typeof j !== "object" || Array.isArray(j)) return null;
  if (j.method !== "Client.SetVolume") return null;
  if (typeof j.id !== "number" && typeof j.id !== "string") return null;
  const p = j.params;
  if (!p || typeof p !== "object" || p.id !== ownId) return null;
  const v = p.volume;
  if (!v || typeof v !== "object") return null;
  if (!Number.isInteger(v.percent) || v.percent < 0 || v.percent > 100) return null;
  if (v.muted !== undefined && typeof v.muted !== "boolean") return null;
  const volume: { percent: number; muted?: boolean } = { percent: v.percent };
  if (v.muted !== undefined) volume.muted = v.muted;
  return JSON.stringify({ id: j.id, jsonrpc: "2.0", method: "Client.SetVolume", params: { id: ownId, volume } });
}

export function handleListenerRequest(
  req: IncomingMessage,
  res: ServerResponse,
  secret: string,
  port: number = SNAPSERVER_HTTP_PORT,
): boolean {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === LISTENER_IDENTITY_PATH && req.method === "GET") {
    const given = url.searchParams.get("id");
    const id = given && validListenerId(given, secret) ? given : mintListenerId(secret);
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify({ id, name: listenerName(req) }));
    return true;
  }
  if (url.pathname !== JSONRPC_PATH) return false;
  const deny = (code: number) => void res.writeHead(code, { "content-type": "text/plain" }).end("Forbidden\n");
  const own = req.headers[LISTENER_ID_HEADER];
  if (req.method !== "POST" || !validListenerId(own, secret)) return deny(403), true;
  let body = "";
  let tooBig = false;
  req.setEncoding("utf8");
  req.on("data", (c: string) => {
    body += c;
    if (body.length > MAX_RPC_BODY) { tooBig = true; req.destroy(); }
  });
  req.on("end", () => {
    if (tooBig) return;
    const scoped = scopeSetVolume(body, own as string);
    if (!scoped) return deny(403);
    const up = httpRequest(
      { host: "127.0.0.1", port, path: JSONRPC_PATH, method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(scoped) } },
      (ur) => {
        res.writeHead(ur.statusCode ?? 502, { "content-type": "application/json" });
        ur.pipe(res);
      },
    );
    up.on("error", () => void res.writeHead(502, { "content-type": "text/plain" }).end("Snapcast unavailable\n"));
    up.end(scoped);
  });
  return true;
}
