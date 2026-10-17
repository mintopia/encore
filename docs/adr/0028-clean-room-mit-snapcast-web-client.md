# A clean-room MIT Snapcast web client, not vendored GPLv3 Snapweb code

The public Listener page must be a real in-browser Snapcast client: it decodes and
time-sync-plays Snapserver's live stream, which is FLAC (`48000:16:2`, snapserver v0.35.0).
Snapweb already implements exactly this, and its player core is cleanly separable from its
React UI (two framework-independent files, `snapstream.ts` + `snapcontrol.ts`, FLAC via the
permissive libflacjs wasm). But **Snapweb is GPLv3 and Encore is MIT**. Vendoring that code
into the web bundle Encore distributes would relicense Encore's client to GPLv3.

We reimplement the Snapcast client clean-room under MIT, against the documented v0.35 wire
protocol: our own `/stream` binary framing and `/jsonrpc` client, a time-sync clock, and
scheduled `AudioBufferSourceNode` playback. We build FLAC-only (no opus/pcm variants) and
lean on permissively-licensed building blocks — libflacjs (FLAC decode) and
standardized-audio-context. We read the GPLv3 source only to understand the wire format,
never to copy it; a protocol is not copyrightable, the code is.

## Considered Options

- **Vendor Snapweb's GPLv3 player core**: rejected — it relicenses Encore's distributed web
  client to GPLv3; a dual-license split to keep the rest MIT is awkward and, once shipped,
  hard to walk back.
- **Just link guests to the bundled Snapweb**: rejected in design — Snapweb is full-control,
  not listen-only, and not Encore-styled; the whole point of the Listener is a safe,
  on-brand, observe-only surface.
- **Clean-room MIT reimplementation** (chosen): the FLAC-only scope keeps it tractable, and
  the one genuinely hard part — decoding FLAC in the browser — is carried by a permissive
  wasm library.

## Consequences

Encore stays MIT. In return we own a Snapcast client's worth of protocol and playback-sync
code, and must track Snapcast wire-protocol changes when the pinned Snapserver (v0.35.0) is
upgraded — the self-tests should pin the framing we rely on. The build ships wasm decoder
assets (libflacjs), which a non-Vite consumer must wire up. The clean-room boundary *is* the
license boundary: a future reader must not paste Snapweb code in as a "shortcut," as that
reintroduces the GPL obligation this ADR exists to avoid.
