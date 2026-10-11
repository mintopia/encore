# Configuration file

All settings live in one YAML file: `config/config.yaml` next to your Compose file
(`/config/config.yaml` inside the container), or `./config.yaml` in standalone mode. Docker
creates it from the commented example on first start.

- The web console reads and writes this file, **keeping your comments**.
- Values are used literally, with no `${VAR}` substitution. The one environment override
  is `ENCORE_PORT`.
- Some changes apply instantly. Others, such as the device name, show a banner offering to
  restart Soloist or Snapcast. Changing the listen address needs Encore itself restarted.

## Sections

| Section | Covers | Docs |
|---|---|---|
| `soloist` | Device name, Soloist API key, data directory, PipeWire device (standalone), extra arguments | [Soloist API key](/guide/api-key) |
| `proxy` | Listen address (default `0.0.0.0:80`, port overridable with `ENCORE_PORT`), auth token, read-only token | [Control WebSocket](/advanced/websocket) |
| `web` | Console username, password (stored hashed), session secret | |
| `autoplay` | Start playing on login | [Autoplay](/features/autoplay) |
| `webhooks` | Outbound HTTP events | [Webhooks](/advanced/webhooks) |
| `relay` | Outbound WebSocket bridge | [Relay](/advanced/relay) |
| `snapcast` | Stream name, Snapweb, `server_config` template | [Snapcast](/audio/snapcast) |
| `audio` | Outputs, per-output delays, Snapcast output, external Snapcast | [Outputs](/audio/outputs), [Sending](/audio/sending) |
| `overlay` | Lyrics overlay styling | [Lyrics](/features/lyrics) |

The fully commented example is
[`config.example.yaml`](https://github.com/mintopia/encore/blob/develop/config.example.yaml)
in the repository.
