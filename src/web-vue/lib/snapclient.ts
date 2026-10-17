import flacWasmUrl from "libflacjs/dist/libflac.wasm.wasm?url";
import {
  MessageType,
  clockOffsetMs,
  decodeMessage,
  encodeHello,
  encodeTimeRequest,
  msToTimeval,
  timevalToMs,
  type ServerSettings,
} from "../../snapcast-protocol";

const FLAC_WASM_FILE = "libflac.wasm.wasm";
const SYNC_BURST = 6;
const SYNC_BURST_MS = 150;
const SYNC_STEADY_MS = 4000;
const SYNC_WINDOW = 24;
const LATE_DROP_S = 0.02;
const CONTINUITY_S = 0.008;

type FlacApi = {
  isReady(): boolean;
  on(ev: "ready", cb: () => void): void;
  create_libflac_decoder(verify?: boolean): number;
  init_decoder_stream(
    id: number,
    read: (n: number) => { buffer: Uint8Array | undefined; readDataLength: number; error: boolean },
    write: (ch: Uint8Array[]) => void,
    err: (code: number, desc: string) => void,
    meta: (m?: { sampleRate: number; channels: number; bitsPerSample: number }) => void,
  ): number;
  FLAC__stream_decoder_process_single(id: number): boolean;
  FLAC__stream_decoder_get_state(id: number): number;
  FLAC__stream_decoder_delete(id: number): void;
};

let flacReady: Promise<FlacApi> | null = null;

// libflac reads FLAC_SCRIPT_LOCATION while it evaluates, so it must be imported after the
// location is set; a static import would be hoisted above it.
function loadFlac(): Promise<FlacApi> {
  flacReady ??= (async () => {
    (globalThis as { FLAC_SCRIPT_LOCATION?: Record<string, string> }).FLAC_SCRIPT_LOCATION = { [FLAC_WASM_FILE]: flacWasmUrl };
    const mod = (await import("libflacjs/dist/libflac.wasm.js")) as { default?: unknown };
    const flac = (mod.default ?? mod) as FlacApi;
    if (flac.isReady()) return flac;
    return new Promise<FlacApi>((resolve) => flac.on("ready", () => resolve(flac)));
  })();
  return flacReady;
}

export type SnapState = "idle" | "connecting" | "playing" | "error";

export interface SnapClientEvents {
  onState(state: SnapState, detail?: string): void;
}

class FlacStream {
  private pending: Uint8Array[] = [];
  private id = 0;
  channels = 2;
  sampleRate = 48000;
  bits = 16;
  onPcm: (channels: Float32Array[]) => void = () => {};

  constructor(private flac: FlacApi, private header: Uint8Array) {
    this.init();
  }

  private init(): void {
    this.id = this.flac.create_libflac_decoder(false);
    const status = this.flac.init_decoder_stream(
      this.id,
      (n) => {
        const head = this.pending[0];
        if (!head) return { buffer: undefined, readDataLength: 0, error: false };
        const take = head.subarray(0, n);
        if (take.length === head.length) this.pending.shift();
        else this.pending[0] = head.subarray(n);
        return { buffer: take, readDataLength: take.length, error: false };
      },
      (ch) => this.write(ch),
      () => {},
      (m) => {
        if (!m) return;
        this.channels = m.channels;
        this.sampleRate = m.sampleRate;
        this.bits = m.bitsPerSample;
      },
    );
    if (status !== 0) throw new Error(`FLAC decoder init failed (${status})`);
    this.pending.push(this.header);
    this.drain();
    if (this.bits !== 16) throw new Error(`unsupported FLAC bit depth ${this.bits}`);
  }

  private write(ch: Uint8Array[]): void {
    const out = ch.map((bytes) => {
      const f = new Float32Array(bytes.byteLength >> 1);
      const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let i = 0; i < f.length; i++) f[i] = v.getInt16(i * 2, true) / 32768;
      return f;
    });
    this.onPcm(out);
  }

  private drain(): void {
    while (this.pending.length > 0) {
      if (!this.flac.FLAC__stream_decoder_process_single(this.id) || this.flac.FLAC__stream_decoder_get_state(this.id) > 3) break;
    }
  }

  push(data: Uint8Array): void {
    this.pending.push(data);
    this.drain();
    if (this.flac.FLAC__stream_decoder_get_state(this.id) > 3) {
      this.pending = [];
      this.flac.FLAC__stream_decoder_delete(this.id);
      this.init();
    }
  }

  destroy(): void {
    this.pending = [];
    if (this.id) this.flac.FLAC__stream_decoder_delete(this.id);
    this.id = 0;
  }
}

export class SnapClient {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private stream: FlacStream | null = null;
  private nextId = 1;
  private samples: { offset: number; rtt: number }[] = [];
  private offsetMs: number | null = null;
  private syncTimer = 0;
  private settings: ServerSettings = { bufferMs: 1000, latency: 0, volume: 100, muted: false };
  private nextStart = 0;
  private chunkTimestamp = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private gain: GainNode | null = null;

  constructor(private events: SnapClientEvents, private url: string) {}

  // Browsers only allow an AudioContext to start inside a user gesture, so call from the tap.
  start(): void {
    if (this.ws) return;
    this.events.onState("connecting");
    const ctx = this.ctx ?? new AudioContext({ latencyHint: "interactive" });
    this.ctx = ctx;
    this.gain ??= ctx.createGain();
    this.gain.connect(ctx.destination);
    void ctx.resume();
    void loadFlac().then(
      (flac) => this.connect(flac),
      (e) => this.fail(e),
    );
  }

  stop(keepContext = false): void {
    window.clearTimeout(this.syncTimer);
    this.ws?.close();
    this.ws = null;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {}
    }
    this.sources.clear();
    this.stream?.destroy();
    this.stream = null;
    if (!keepContext) {
      void this.ctx?.close();
      this.ctx = null;
      this.gain = null;
    }
    this.samples = [];
    this.offsetMs = null;
    this.nextStart = 0;
    this.events.onState("idle");
  }

  private fail(e: unknown): void {
    this.stop(true);
    this.events.onState("error", e instanceof Error ? e.message : String(e));
  }

  private connect(flac: FlacApi): void {
    if (!this.ctx) return;
    const ws = new WebSocket(this.url);
    ws.binaryType = "arraybuffer";
    this.ws = ws;
    ws.onopen = () => {
      ws.send(
        encodeHello(this.nextId++, msToTimeval(Date.now()), {
          mac: "00:00:00:00:00:00",
          hostName: "encore-listener",
          version: "0.0.0",
          clientName: "Encore Listener",
          os: navigator.platform || "web",
          arch: "web",
          instance: Math.floor(Math.random() * 0x7fffffff),
          id: this.clientId(),
        }),
      );
      this.syncLoop(0);
    };
    ws.onmessage = (ev) => {
      try {
        this.onMessage(flac, new Uint8Array(ev.data as ArrayBuffer));
      } catch (e) {
        this.fail(e);
      }
    };
    ws.onerror = () => this.fail(new Error("stream connection failed"));
    ws.onclose = () => {
      if (this.ws === ws) this.fail(new Error("stream closed"));
    };
  }

  private clientId(): string {
    const key = "encore-listener-id";
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }

  private syncLoop(n: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(encodeTimeRequest(this.nextId++, msToTimeval(Date.now())));
    this.syncTimer = window.setTimeout(() => this.syncLoop(n + 1), n < SYNC_BURST ? SYNC_BURST_MS : SYNC_STEADY_MS);
  }

  private onMessage(flac: FlacApi, buf: Uint8Array): void {
    const msg = decodeMessage(buf);
    switch (msg.type) {
      case MessageType.ServerSettings:
        this.settings = msg.settings;
        break;
      case MessageType.Time: {
        const now = Date.now();
        const offset = clockOffsetMs(msg, now);
        const c2s = timevalToMs(msg.latency);
        const rtt = c2s + (now - timevalToMs(msg.header.sent));
        this.samples.push({ offset, rtt });
        if (this.samples.length > SYNC_WINDOW) this.samples.shift();
        this.offsetMs = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a)).offset;
        break;
      }
      case MessageType.CodecHeader:
        if (msg.codec.codec !== "flac") throw new Error(`unsupported codec "${msg.codec.codec}"`);
        this.stream?.destroy();
        this.stream = new FlacStream(flac, msg.codec.payload);
        this.stream.onPcm = (ch) => this.play(ch);
        break;
      case MessageType.WireChunk:
        if (!this.stream) break;
        this.chunkTimestamp = timevalToMs(msg.chunk.timestamp);
        this.stream.push(msg.chunk.payload);
        break;
      default:
        break;
    }
  }

  private play(channels: Float32Array[]): void {
    const ctx = this.ctx;
    const stream = this.stream;
    if (!ctx || !stream || this.offsetMs === null || !channels[0]?.length) return;
    const frames = channels[0].length;
    const durS = frames / stream.sampleRate;
    const playServerMs = this.chunkTimestamp + this.settings.bufferMs - this.settings.latency;
    const playClientMs = playServerMs - this.offsetMs;
    const outLatency = (ctx.outputLatency || 0) + ctx.baseLatency;
    let when = ctx.currentTime + (playClientMs - Date.now()) / 1000 - outLatency;
    if (this.nextStart && Math.abs(when - this.nextStart) < CONTINUITY_S) when = this.nextStart;
    this.chunkTimestamp += durS * 1000;
    if (when < ctx.currentTime - LATE_DROP_S) return;
    const buffer = ctx.createBuffer(stream.channels, frames, stream.sampleRate);
    for (let c = 0; c < stream.channels; c++) buffer.copyToChannel((channels[c] ?? channels[0]) as Float32Array<ArrayBuffer>, c);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.gain!);
    src.onended = () => this.sources.delete(src);
    this.sources.add(src);
    src.start(Math.max(when, ctx.currentTime));
    this.nextStart = when + durS;
    this.events.onState("playing");
  }
}
