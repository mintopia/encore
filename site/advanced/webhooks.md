# Webhooks

Encore can POST Soloist's events to any URL: a Home Assistant webhook, n8n, a Discord bot
or your own app. Configure them in **Settings → Webhooks**.

Each request is an HTTP `POST` with the raw event JSON as the body
(`Content-Type: application/json`).

## Options

| Setting | Config key | Notes |
|---|---|---|
| **Default URL** | `webhooks.default_url` | Receives all ten state events. Empty turns it off. |
| **Per-event overrides** | `webhooks.urls` | Send a specific event to a different URL. Replaces the default for that event. |
| **Min Interval (ms)** | `webhooks.delay_ms` | Minimum gap between requests. 0 means no limit. |
| **Authorization Header** | `webhooks.secret` | Optional. Sent as `Authorization: Bearer <secret>`. |

## Events

The default URL receives these state events:

`auth_state` · `playback_state` · `track_changed` · `playback_changed` · `volume_changed` ·
`device_changed` · `context_changed` · `options_changed` · `position_sync` · `queue_changed`

Other event types, such as `error`, are only sent if you add them under `webhooks.urls` in
`config.yaml`. The console's override list only offers the ten state events.

## Delivery

Webhooks are sent one at a time from a queue, each with a timeout of about 5 seconds. If
more than 1,000 are waiting, the oldest are dropped. Failures and non-2xx responses are
logged and shown in the **Debug** page's webhook log, but never retried.

```yaml
webhooks:
  default_url: "https://example.com/hooks/spotify"
  urls:
    track_changed: "https://example.com/hooks/track"
  secret: "change-me"
  delay_ms: 1000
```
