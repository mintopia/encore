# External Snapcast is fed by a Proxy-supervised pw-record capture node

An operator can send Soloist's audio to an external Snapserver as well as the bundled one.
Snapserver can't forward a stream to another server, so the external server has to take
the audio through its own `tcp://` stream source. We feed it from a `pw-record` child the
Proxy supervises: `--raw --target 0` with `node.name = soloist-snapcast-external` and
`node.autoconnect = false`, at 48000:16:2. `reconcileOutputs` links `soloist-sink:monitor`
to the node's `input_FL/FR` ports, exactly like any other Audio Output (ADR-0011). Its
stdout is raw PCM, which the Proxy sends one of two ways:

- **push**: dial `host:port`, where the external server's tcp source runs in server mode
  (the default). Outbound only, so it works through NAT.
- **pull**: listen on `port` and let the external server dial us (`mode=client`).

## Considered Options

- **Second `[stream]` in the bundled snapserver.conf**: rejected. Snapserver serves
  streams to clients and cannot push one to another server.
- **PipeWire `module-snapcast-discover`**: rejected. It is driven by mDNS discovery and
  has the server dial back into us, so it can't target a fixed host across networks.
- **PipeWire `module-protocol-simple`**: covers pull only. Push would still need a
  separate dialer, so it would mean two mechanisms instead of one.
- **pw-record feeder** (chosen): one capture node serves both modes, and linking stays
  with the reconcile owner.

## Consequences

This is the "second long-lived process" that ADR-0002 avoided for the bundled server.
It's acceptable here because it's opt-in and a single child the Proxy owns. If it exits,
it's respawned after 2s, and each spawn triggers a reconcile so the new node gets
re-linked. Delivery is best-effort: while the server is disconnected (push) or absent
(pull), audio is dropped. A peer more than about 1.4s behind (256 KB buffered) drops
chunks, so a slow peer can't grow our memory. Push redials with backoff from 0.5s to 30s.
Docker only, like every Audio Output. Applies live on save, with no Snapcast restart.
