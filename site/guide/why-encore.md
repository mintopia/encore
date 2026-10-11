# Encore vs native Soloist

You can run Spotify Soloist directly on a Pi. This table compares that with running it
through Encore.

<div class="compare">

| | Soloist on its own | With Encore |
|---|---|---|
| Audio stack | Install and run PipeWire and a session manager (WirePlumber) on a headless system, with no desktop session to start them | Bundled and preconfigured in the container |
| Getting Soloist | Download the right build for your CPU by hand | Downloaded automatically for `arm64` or `x86_64` |
| 90-day expiry | Builds stop working after 90 days. You notice when the music stops | Refreshed on start-up once 60 days old, and replaced automatically if one expires |
| Running at boot | Write and maintain your own systemd unit | `restart: unless-stopped` |
| Configuration | Command-line flags | Web console, or a commented `config.yaml` |
| Control socket | Local only, no authentication | Token-authenticated, safe to expose on your LAN |
| Multi-room | Not included | Built-in Snapcast server, or send to your own |
| Extra speakers | One output | Fan out to several outputs, each with its own delay |
| Integrations | None | Webhooks, relay, Pusher/Reverb, lyrics overlay |

</div>

## When native Soloist makes sense

If you already run PipeWire on the machine, only need one output and don't mind managing
updates, Soloist on its own is fine. Encore also has a
[standalone mode](/guide/other-installs#standalone-npx) that uses your existing PipeWire
and adds the console and integrations without Docker.
