import { setTimeout as sleep } from "node:timers/promises";
import type { WebSocket, RawData } from "ws";

export interface ReconnectLoopOptions {
  backoffBase: number;
  backoffMax: number;
  isStopped(): boolean;
  // Must read the owner's *current* wake handle, not a cached one: the owner replaces it
  // on every apply()/stop() signal, so a stale reference would never resolve.
  getWake(): { promise: Promise<void> };
  // Return false to skip dialing this iteration and park on wake instead — no backoff
  // change — used by the Relay while no url is configured.
  shouldDial(): boolean;
  connect(): WebSocket;
  onOpen(conn: WebSocket): void;
  onMessage(data: RawData, isBinary: boolean): void;
  onError(err: Error): void;
  onSettled(): void;
  onReconnectWait?(backoffSeconds: number): void;
  // Ping this often and drop the socket if the previous ping got no pong, so a NAT
  // that silently dropped an idle connection is noticed.
  heartbeatMs?: number;
}

export async function reconnectLoop(opts: ReconnectLoopOptions): Promise<void> {
  let backoff = opts.backoffBase;
  while (!opts.isStopped()) {
    if (!opts.shouldDial()) {
      await opts.getWake().promise;
      continue;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const conn = opts.connect();
        let heartbeat: ReturnType<typeof setInterval> | undefined;
        conn.on("open", () => {
          opts.onOpen(conn);
          backoff = opts.backoffBase;
          if (!opts.heartbeatMs) return;
          let alive = true;
          conn.on("pong", () => (alive = true));
          heartbeat = setInterval(() => {
            if (!alive) return conn.terminate();
            alive = false;
            conn.ping();
          }, opts.heartbeatMs);
        });
        conn.on("message", (data, isBinary) => opts.onMessage(data, isBinary));
        conn.on("error", (err) => reject(err));
        conn.on("close", () => {
          clearInterval(heartbeat);
          resolve();
        });
      });
    } catch (err) {
      opts.onError(err as Error);
    } finally {
      opts.onSettled();
    }
    if (opts.isStopped()) break;
    opts.onReconnectWait?.(backoff);
    // Backoff, but wake early on the owner's apply()/stop() so shutdown/reconfig never
    // waits out the cap.
    await Promise.race([sleep(backoff * 1000), opts.getWake().promise]);
    backoff = Math.min(backoff * 2, opts.backoffMax);
  }
}
