// Snapcast stream protocol v2 (snapserver v0.35.0), clean-room from the public description. DOM/Node-free so browser and selftests share it.

export const BASE_HEADER_SIZE = 26;
export const STREAM_PROTOCOL_VERSION = 2;

export const MessageType = {
  CodecHeader: 1,
  WireChunk: 2,
  ServerSettings: 3,
  Time: 4,
  Hello: 5,
  StreamTags: 7,
} as const;

export interface Timeval {
  sec: number;
  usec: number;
}

export interface BaseHeader {
  type: number;
  id: number;
  refersTo: number;
  sent: Timeval;
  received: Timeval;
  size: number;
}

export interface CodecHeader {
  codec: string;
  payload: Uint8Array;
}

export interface WireChunk {
  timestamp: Timeval;
  payload: Uint8Array;
}

export interface ServerSettings {
  bufferMs: number;
  latency: number;
  volume: number;
  muted: boolean;
}

export type SnapMessage =
  | { type: typeof MessageType.CodecHeader; header: BaseHeader; codec: CodecHeader }
  | { type: typeof MessageType.WireChunk; header: BaseHeader; chunk: WireChunk }
  | { type: typeof MessageType.ServerSettings; header: BaseHeader; settings: ServerSettings }
  | { type: typeof MessageType.Time; header: BaseHeader; latency: Timeval }
  | { type: "other"; header: BaseHeader };

export function timevalToMs(t: Timeval): number {
  return t.sec * 1000 + t.usec / 1000;
}

export function msToTimeval(ms: number): Timeval {
  const sec = Math.floor(ms / 1000);
  return { sec, usec: Math.round((ms - sec * 1000) * 1000) };
}

function view(buf: Uint8Array): DataView {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function decodeHeader(buf: Uint8Array): BaseHeader {
  if (buf.byteLength < BASE_HEADER_SIZE) throw new Error("snapcast: short header");
  const v = view(buf);
  return {
    type: v.getUint16(0, true),
    id: v.getUint16(2, true),
    refersTo: v.getUint16(4, true),
    sent: { sec: v.getInt32(6, true), usec: v.getInt32(10, true) },
    received: { sec: v.getInt32(14, true), usec: v.getInt32(18, true) },
    size: v.getUint32(22, true),
  };
}

export function encodeMessage(type: number, id: number, refersTo: number, sent: Timeval, payload: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(BASE_HEADER_SIZE + payload.byteLength);
  const v = view(out);
  v.setUint16(0, type, true);
  v.setUint16(2, id, true);
  v.setUint16(4, refersTo, true);
  v.setInt32(6, sent.sec, true);
  v.setInt32(10, sent.usec, true);
  v.setInt32(14, 0, true);
  v.setInt32(18, 0, true);
  v.setUint32(22, payload.byteLength, true);
  out.set(payload, BASE_HEADER_SIZE);
  return out;
}

export interface HelloInfo {
  mac: string;
  hostName: string;
  version: string;
  clientName: string;
  os: string;
  arch: string;
  instance: number;
  id: string;
}

export function encodeHello(id: number, sent: Timeval, info: HelloInfo): Uint8Array<ArrayBuffer> {
  const json = new TextEncoder().encode(
    JSON.stringify({
      MAC: info.mac,
      HostName: info.hostName,
      Version: info.version,
      ClientName: info.clientName,
      OS: info.os,
      Arch: info.arch,
      Instance: info.instance,
      ID: info.id,
      SnapStreamProtocolVersion: STREAM_PROTOCOL_VERSION,
    }),
  );
  const payload = new Uint8Array(4 + json.byteLength);
  view(payload).setUint32(0, json.byteLength, true);
  payload.set(json, 4);
  return encodeMessage(MessageType.Hello, id, 0, sent, payload);
}

export function encodeTimeRequest(id: number, sent: Timeval): Uint8Array<ArrayBuffer> {
  return encodeMessage(MessageType.Time, id, 0, sent, new Uint8Array(8));
}

export function decodeMessage(buf: Uint8Array): SnapMessage {
  const header = decodeHeader(buf);
  if (buf.byteLength < BASE_HEADER_SIZE + header.size) throw new Error("snapcast: truncated payload");
  const body = buf.subarray(BASE_HEADER_SIZE, BASE_HEADER_SIZE + header.size);
  const v = view(body);
  switch (header.type) {
    case MessageType.CodecHeader: {
      const codecLen = v.getUint32(0, true);
      const codec = new TextDecoder().decode(body.subarray(4, 4 + codecLen));
      const payloadLen = v.getUint32(4 + codecLen, true);
      const start = 8 + codecLen;
      return { type: MessageType.CodecHeader, header, codec: { codec, payload: body.subarray(start, start + payloadLen) } };
    }
    case MessageType.WireChunk: {
      const timestamp = { sec: v.getInt32(0, true), usec: v.getInt32(4, true) };
      const len = v.getUint32(8, true);
      return { type: MessageType.WireChunk, header, chunk: { timestamp, payload: body.subarray(12, 12 + len) } };
    }
    case MessageType.ServerSettings: {
      const len = v.getUint32(0, true);
      const j = JSON.parse(new TextDecoder().decode(body.subarray(4, 4 + len))) as Partial<ServerSettings>;
      return {
        type: MessageType.ServerSettings,
        header,
        settings: { bufferMs: Number(j.bufferMs ?? 1000), latency: Number(j.latency ?? 0), volume: Number(j.volume ?? 100), muted: Boolean(j.muted) },
      };
    }
    case MessageType.Time:
      return { type: MessageType.Time, header, latency: { sec: v.getInt32(0, true), usec: v.getInt32(4, true) } };
    default:
      return { type: "other", header };
  }
}

// Server-minus-client clock offset in ms: (c2s - s2c) / 2, so symmetric path delay cancels.
export function clockOffsetMs(reply: { header: BaseHeader; latency: Timeval }, clientReceivedMs: number): number {
  const c2s = timevalToMs(reply.latency);
  const s2c = clientReceivedMs - timevalToMs(reply.header.sent);
  return (c2s - s2c) / 2;
}
