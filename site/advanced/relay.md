# WebSocket relay

The relay is an **outbound** WebSocket from Encore to a server you run. Every event Soloist
emits is republished to it, and every message the server sends back is passed to Soloist as
a command.

Use it to get live playback and full control into a web app hosted somewhere else. The Pi
connects out, so you don't open any inbound ports or poll the Spotify Web API.

```
Spotify app ──Connect──▶ Soloist ⇄ Encore ══ outbound wss:// ══▶ your server ⇄ your users
```

Set it up in **Settings → WebSocket Relay**.

## Options

| Setting | Config key | Notes |
|---|---|---|
| **Relay URL** | `relay.url` | `ws://` or `wss://`. Empty turns the relay off. |
| **Authorization Header** | `relay.authorization` | Optional. Sent verbatim as the `Authorization` header when connecting, e.g. `Bearer abc123`. |
| **Pusher protocol** | `relay.pusher` | Wraps frames in the Pusher protocol. See [Pusher & Laravel Reverb](/advanced/pusher). |
| **Channel** | `relay.channel` | Pusher only. |
| **App key / App secret** | `relay.app_key`, `relay.app_secret` | Pusher only, for signing private and presence channels. |

The section shows the connection state and last error. If the connection drops, Encore
reconnects with backoff.

## What's sent

In plain mode, Soloist's frames are forwarded **verbatim**: the same JSON that clients of
the [control WebSocket](/advanced/websocket) receive, such as `track_changed`,
`playback_state` and `volume_changed`. Messages your server sends are passed straight to
Soloist, so they use Soloist's command format. See the
[Soloist documentation](https://developer.spotify.com/documentation/soloist).

## Security

::: danger The relay server has full control
Anything your relay server sends is executed by Soloist: play, pause, skip, volume. There's
no per-message check. Treat the server like a client holding the auth token. Use `wss://`
and an `Authorization` header, and only point the relay at a server you control.
:::

```yaml
relay:
  url: "wss://example.com/relay"
  authorization: "Bearer change-me"
  pusher: false
```
