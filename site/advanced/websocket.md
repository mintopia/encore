# Control WebSocket

Soloist has its own control WebSocket, with live events and commands, but no authentication,
so Encore keeps it on localhost. Encore exposes it on its web port (80 by default) behind a token instead,
passing frames through unchanged in both directions.

```
ws://<your-pi>/
```

## Authenticating

Present the **WebSocket auth token** from **Settings → Soloist** in either form:

```http
Authorization: Bearer <token>
```

```
ws://<your-pi>/?token=<token>
```

A missing or wrong token is rejected with `401` before the WebSocket opens.

## Access levels

| Credential | Can watch events | Can send commands |
|---|:-:|:-:|
| Auth token (`proxy.token`) | ✓ | ✓ |
| Web console login (same-origin only) | ✓ | ✓ |
| Read-only token (`proxy.readonly_token`) | ✓ | |

The read-only token is generated on first start and used by the
[lyrics overlay](/features/lyrics). Commands sent on a read-only connection are dropped.

Every connected client is listed on the **Debug** page with its access level, address and
uptime.

## Message format

Frames are Soloist's own JSON messages, unchanged. See the
[Soloist documentation](https://developer.spotify.com/documentation/soloist) for event and
command types.

```js
const ws = new WebSocket('ws://encore.local/?token=YOUR_TOKEN');
ws.onmessage = (e) => {
  const frame = JSON.parse(e.data);
  if (frame.type === 'track_changed') console.log(frame);
};
```

To reach it from outside your network without opening ports, use the
[relay](/advanced/relay).
