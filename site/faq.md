# FAQ

## Which boards does it run on?

Any board that supports 64-bit and runs a 64-bit Linux with Docker, because Spotify only
builds Soloist for `arm64` and `x86_64`. That includes Raspberry Pi, Orange Pi, Banana Pi
and other single-board computers, usually on Raspberry Pi OS (64-bit) or Armbian.

The Raspberry Pi 1, Raspberry Pi 2, original Pi Zero and Zero W, and Pico aren't supported.
They can't run a 64-bit OS.

## Something else is already using port 80

Set `ENCORE_PORT` in your Compose file. See
[Changing the web port](/guide/raspberry-pi#changing-the-web-port).

## Does it need Spotify Premium?

Yes. Both Spotify Connect playback and the Soloist API key need Premium.

## My device doesn't appear in Spotify

- Check the container uses `network_mode: host`. Discovery uses mDNS, which doesn't cross
  Docker's bridge network.
- Make sure your phone or computer is on the same network, and not on guest Wi-Fi with
  client isolation.
- Check Soloist is running: the console's Now Playing page and
  `docker compose logs` show its state.

## It says "Authentication required" even though my Soloist API key is valid

The Soloist API key authorises the app, but doesn't log you in. Pick the device from the Spotify app
on the same network to pair it. See [First run](/guide/first-run#pair-with-spotify).

## Can I run it on macOS or Windows?

Not with Docker Desktop. Its VM can't put mDNS on your LAN, so pairing never completes. A
Linux machine or a single-board computer is the way to go.

## Do I need PipeWire on the host?

Not with Docker. The image runs its own PipeWire. You only need it for
[standalone mode](/guide/other-installs#standalone-npx).

## Why does it download Soloist on start-up?

Spotify's licence doesn't allow Soloist to be redistributed, and each build expires after 90
days. Encore downloads it on first start and refreshes it automatically.

## Is there HTTPS?

Not built in. Put a [reverse proxy](/advanced/https) in front if you need it.

## Was AI used to build this?

Yes. AI tools (Claude, Codex) were used in writing Encore.

## I found a bug

Please [open an issue](https://github.com/mintopia/encore/issues).
