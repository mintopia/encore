# Snapcast server

The Docker image includes a [Snapcast](https://github.com/badaix/snapcast) server. Snapcast
streams audio to any number of clients and keeps them in sync, so music plays in time in
every room, from one Spotify device.

It's on by default. The Spotify stream is available to clients as soon as Encore starts.

## Adding a room

Any Linux machine, including another Pi, can be a room. Install the client:

```bash
sudo apt install snapclient
```

Clients usually find the server automatically over mDNS. Encore advertises through the
Pi's own Avahi, so this needs `avahi-daemon` running on the Pi (it is on Raspberry Pi OS)
and the `/run/dbus` mount from the [Compose file](/guide/raspberry-pi). To point a client
at your Encore Pi explicitly, set the host in `/etc/default/snapclient`:

```bash
SNAPCLIENT_OPTS="--host encore.local"
```

then `sudo systemctl restart snapclient`.

Snapcast also has clients for Android, a browser player in Snapweb, and integrations for
Home Assistant and others. See the
[Snapcast project](https://github.com/badaix/snapcast#client) for the full list.

## Snapweb

Snapweb, Snapcast's web UI, is at `http://<your-pi>:1780`. Use it to set per-room volumes,
group rooms and adjust latency. It's linked from the menu in the Encore console. Turn it off
with **Enable Snapweb** in **Settings → Snapcast**.

To let guests listen along on their phones without Snapweb's controls, use the
[Listener](/features/listener).

## Customising snapserver.conf

**Settings → Snapcast** includes the full `snapserver.conf` as an editable template, for
changing the codec, buffer size, ports and so on. These placeholders are filled in when it's
written:

| Placeholder | Becomes |
|---|---|
| <code v-pre>{{stream}}</code> | The `source = pipewire://…` line carrying Soloist's audio. Keep it. |
| <code v-pre>{{snapweb}}</code> | `true` when Snapweb or the [Listener](/features/listener) is on, otherwise `false` |
| <code v-pre>{{bind}}</code> | `0.0.0.0` when Snapweb is on. Otherwise `127.0.0.1`, so only Encore can reach it for the Listener |

The default:

```ini-vue
[stream]
{{stream}}

[http]
enabled = {{snapweb}}
bind_to_address = {{bind}}
port = 1780
doc_root = /usr/share/snapserver/snapweb
```

Snapserver only reads its config on start, so after saving, a banner offers to **restart
Snapcast**. That briefly drops audio to Snapcast clients. Soloist and local outputs keep
playing.

The stream name clients see (default `Spotify`) is set on the Snapcast row in
**Settings → Audio Outputs**. It can't contain `&`, `#`, `?`, `=`, `%` or `+`.

## Ports

| Port | What |
|---|---|
| 1704 | Audio stream to clients |
| 1705 | Control (JSON-RPC) |
| 1780 | Snapweb and HTTP API |

Already running a Snapserver elsewhere? [Send to it](/audio/sending) as well.
