# Sending to another Snapserver

If you already run a Snapcast server, on a NAS or Home Assistant for example, Encore can feed
Soloist's audio to it as well as to the built-in one. Set it up under
**Settings → Snapcast → External Snapcast server**. Changes apply as soon as you save, with no
restart.

A Snapserver can't relay a stream to another server, so the external server takes the audio
through its own `tcp://` stream source: raw PCM, 48000 Hz, 16-bit, stereo.

## Choosing a mode

| Mode | Who connects | Use when |
|---|---|---|
| **Push** | Encore connects to the server | The server is reachable from the Pi, including across NAT or a VPN. Outbound only. |
| **Pull** | The server connects to Encore | The server can reach the Pi but not the other way round. |

The console shows the exact `source =` line to add to the other server, filled in with your
settings.

### Push

Set **Mode** to *Push*, and enter the **Server host** and **Server port**. On the external
server, add a TCP source in server mode (the default) to `snapserver.conf`:

```ini
source = tcp://0.0.0.0:4953?name=Spotify&sampleformat=48000:16:2
```

If the connection drops, Encore reconnects with backoff, from half a second up to 30
seconds.

### Pull

Set **Mode** to *Pull* and choose a **Listen port**. On the external server, add a TCP source
in client mode pointing at your Pi:

```ini
source = tcp://encore.local:4953?name=Spotify&mode=client&sampleformat=48000:16:2
```

## Status

The section shows whether it's connected (push) or how many servers are connected (pull),
along with the last error.

## Limitations

- **Best effort.** While the other server is disconnected, that audio is dropped rather than
  queued. A server more than about 1.4 seconds behind has chunks dropped, so a slow link
  can't fill the Pi's memory.
- **Docker only**, like all audio outputs.
- **Sync is per server.** Rooms on the external server stay in sync with each other, but not
  with rooms on Encore's built-in Snapcast.

```yaml
audio:
  external_snapcast:
    mode: "push"        # off | push | pull
    host: "nas.lan"     # push only
    port: 4953
```
