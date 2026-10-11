# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Home self-hosters: hobbyists turning a Raspberry Pi or another 64-bit single-board computer
into an always-on Spotify Connect speaker, sometimes across several rooms. They're
comfortable flashing an SD card, using SSH and pasting a Docker Compose file, but they don't
want to configure PipeWire, track Soloist build expiry or write systemd units. Their job:
get music playing from the Spotify app on their phone and then forget the box exists.

Secondary audiences, which aren't the design priority: Music Party and LAN-party hosts,
streamers using the lyrics overlay, and developers using the control WebSocket, relay or
webhooks.

## Product Purpose

Encore makes it easy to run Spotify Soloist, Spotify's official headless Spotify Connect
client, on a Pi or other 64-bit Linux box. It handles everything around Soloist: downloading
it and replacing builds before they expire, bundled PipeWire, a web console for setup and
playback, audio outputs and Snapcast multi-room, plus integrations.

Success: someone with a spare Pi goes from a blank SD card to music playing from the Spotify
app by following one guide, and the box keeps working without attention.

## Positioning

The easiest route to Spotify's official headless client: one Compose file, with PipeWire and
updates handled for you. Encore doesn't compare itself to other projects by name (for
example Raspotify or librespot); it describes what it does.

## Operating Context

- **Install:** Raspberry Pi OS (64-bit) or Armbian, Docker, one Compose file with host
  networking. A standalone `npx @mintopia/encore` mode exists for machines that already run
  PipeWire.
- **First run:** a setup page in the browser creates the console login, then the user adds a
  Soloist API key from Spotify's developer dashboard and pairs by picking the device in the
  Spotify app on the same network. Spotify Premium is required.
- **Day to day:** the box runs headless. The web console (port 80 by default) is used for
  settings, Now Playing, lyrics styling and debugging.
- **Public face:** the docs site at <https://pimusic.stream/> (VitePress, `site/`), with
  the README on GitHub (`mintopia/encore`).

## Capabilities and Constraints

- Soloist is downloaded at runtime and can't be redistributed (Spotify's licence). Builds
  expire after 90 days, and Spotify only publishes `arm64` and `x86_64` builds, so a 64-bit
  OS is required.
- Spotify Connect pairing uses mDNS, so Docker needs host networking. Docker Desktop on macOS
  and Windows can't complete pairing.
- Docker-only: audio output fan-out with per-output delay, the bundled Snapcast server, and
  sending to an external Snapserver. Standalone mode picks a single PipeWire device.
- Terminology: always "Soloist API key", never "Spotify API key". It authorises the app and
  doesn't log anyone in. Pairing is a separate step.
- No built-in HTTPS; a reverse proxy is the documented route.
- Not yet widely distributed, so breaking changes don't need migration paths.

## Brand Commitments

- Name: **Encore**. Repo `mintopia/encore`, npm `@mintopia/encore`, image
  `ghcr.io/mintopia/encore`.
- Voice: UK English, plain and direct, practical, no hype.
- Always state that Encore isn't affiliated with or endorsed by Spotify or Raspberry Pi Ltd.
- Disclose that AI tools (Claude, Codex) were used to build it.
- Don't use "Spotify", "Spot" or "-ify" in product naming.

## Evidence on Hand

- Real console screenshots: `docs/screenshots/` (landing, lyrics, overlay, settings, debug,
  setup). They still show the old "Soloist Proxy" wordmark, which is accepted for now. The
  docs hero uses a crop without it (`site/public/screenshots/now-playing-hero.webp`).
- Brand mark: the teal tile with the Phosphor music-notes glyph (`site/public/favicon.svg`,
  the console favicon).
- No testimonials, user counts, benchmarks or press exist. Don't invent any.

## Product Principles

1. **One guide to music.** Setup has to work from a blank SD card by following one page.
   Anything that adds steps needs a strong reason.
2. **Set and forget.** The box should keep working unattended: builds refreshed, restarts
   automatic, no surprise volume jumps.
3. **Official, not clever.** Build on Spotify's own Soloist and say so plainly. Explain what
   Encore handles instead of comparing it with other projects.
4. **Honest about limits.** State hardware, Premium, Docker-only and network requirements up
   front rather than letting users discover them.
5. **Integrations stay secondary.** The relay, webhooks and overlay are there for those who
   want them, but they never get in the way of the speaker use case.
