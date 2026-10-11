# Other Linux & standalone

The Raspberry Pi guide works the same way on any 64-bit Linux machine. There's also a
standalone mode that runs without Docker.

## Docker on any Linux

Use the [same Compose file](/guide/raspberry-pi#what-the-compose-file-does) on any `amd64`
or `arm64` Linux host with Docker. Everything works the same: bundled PipeWire, Snapcast
and hardware outputs.

::: warning Docker Desktop on macOS and Windows
Spotify Connect pairing relies on mDNS on your LAN, which needs host networking. Docker
Desktop runs containers in a VM, so the device never appears in Spotify. You can test the
console with published ports, but you can't complete pairing.
:::

## Standalone (npx)

Standalone mode runs Encore directly with Node.js and uses your machine's existing
PipeWire.

```bash
npx @mintopia/encore
```

Then open `http://<host>`.

::: tip Port 80 needs root
As a normal user, pick a higher port and browse to that instead:

```bash
ENCORE_PORT=8687 npx @mintopia/encore
```
:::

**You need:**

- Node.js 24 or newer
- PipeWire running on the host (Soloist plays to the default PipeWire sink unless you pick
  one)

**What's different from Docker:**

| | Docker | Standalone |
|---|---|---|
| PipeWire | Bundled | Yours |
| Output choice | Several outputs at once, with delays | One PipeWire device, chosen in **Settings → Soloist** |
| Snapcast server | Built in | Not included |
| Sending to another Snapserver | Yes | No |
| Console, webhooks, relay, lyrics | Yes | Yes |

Settings are stored in `./config.yaml` by default. Pass `--config <path>` to change that.
Soloist's data goes in `./.soloist-data` unless you set `soloist.data_dir`.
