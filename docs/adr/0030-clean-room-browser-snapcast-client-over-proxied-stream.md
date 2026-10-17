# The Listener plays audio with a clean-room Snapcast client over a proxied /stream

The Listener (`/listen`, opt-in via `snapcast.listener`) lets a guest tap Start and hear
the room's stream, time-synced with the physical Snapclients. The browser speaks Snapcast's
binary `/stream` WebSocket protocol (snapserver v0.35.0, protocol v2) itself: Hello, Time
round trips for the clock offset, CodecHeader plus WireChunk for FLAC, ServerSettings for
buffer and latency. Decoded blocks are scheduled on the Web Audio clock at
`chunk timestamp + bufferMs - latency`, mapped through the measured offset.

- **Reverse proxy, not Snapserver's 1780.** The Proxy splices an unauthenticated `/stream`
  upgrade to `127.0.0.1:1780` when `snapcast.listener` is on, dropping `Cookie` and
  `Authorization` on the way. Guests only ever reach Encore's port. Enabling the Listener
  turns Snapserver's `[http]` on (the stream endpoint lives there) even if Snapweb is off.
- **Clean-room, MIT.** Snapweb is GPLv3, so none of its source is used; the protocol module
  (`src/snapcast-protocol.ts`) is written from the public protocol description and pinned
  by selftests. FLAC decoding uses `libflacjs` (MIT); its wasm ships as a build asset.
- **Start is the user gesture** that creates and resumes the `AudioContext`; Stop closes the
  socket, decoder and context.

## Consequences

`snapcast.listener` now needs a Snapcast restart to apply, because it can change the
rendered `snapserver.conf`. Late chunks are dropped rather than played out of sync.
