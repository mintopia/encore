import { connect } from "node:net";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { makeLog } from "./log.js";

const log = makeLog("snapstream");

export const SNAPSTREAM_PATH = "/stream";
export const SNAPSERVER_HTTP_PORT = 1780;

// A Web Session cookie must not leak to Snapserver, which needs no credentials.
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
