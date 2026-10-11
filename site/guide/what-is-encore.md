# What is Encore?

Encore turns a Raspberry Pi, another single-board computer such as an Orange Pi or Banana Pi,
or any 64-bit Linux box into a Spotify Connect speaker. It runs
[Spotify Soloist](https://developer.spotify.com/documentation/soloist), Spotify's official
headless Spotify Connect client, and wraps it in everything you'd otherwise have to build
yourself: audio plumbing, updates, a web console and integrations.

Once it's running, your Pi appears in the Spotify app's device list (the speaker icon) on
any phone, desktop or tablet on the same network. Pick it and the music plays from the Pi.

## How the Spotify integration works

Spotify Soloist is a client Spotify publishes for developers to build headless speakers.
Two things connect it to Spotify, and they're separate steps:

| Step | What it does | Where |
|---|---|---|
| **Soloist API key** | Authorises the Soloist app itself. Doesn't log anyone in. | [Spotify for Developers](https://developer.spotify.com), needs Premium. [Guide](/guide/api-key) |
| **Pairing** | Logs a Spotify account in, over Spotify Connect on your LAN. | Pick the device in the Spotify app. [Guide](/guide/first-run) |

Because it's Spotify's own client, there's no reverse-engineered protocol to break when
Spotify changes something on their side.

::: info Spotify Premium
Spotify Connect playback, and the Soloist API key, both need a Spotify Premium account.
:::

## What Encore adds

Soloist on its own is a single binary with a local, unauthenticated control socket. Encore
adds:

- **Install and update management.** Spotify's licence doesn't allow Soloist to be
  redistributed and each build expires after 90 days. Encore downloads it on first run,
  refreshes it on start-up once it's 60 days old, and swaps in a fresh build automatically
  if one expires.
- **Audio, handled.** Soloist needs PipeWire, which headless distros such as Raspberry Pi
  OS Lite and Armbian don't run out of the box. The Docker image ships PipeWire and WirePlumber already
  configured. You pass the sound devices through.
- **A [web console](/features/console)** for setup, Now Playing, audio outputs, lyrics and
  debugging.
- **[Snapcast](/audio/snapcast)** for synced multi-room audio, and the option to
  [send to another Snapserver](/audio/sending).
- **Integrations:** an [authenticated control WebSocket](/advanced/websocket),
  [webhooks](/advanced/webhooks), an [outbound relay](/advanced/relay) (including
  [Pusher and Laravel Reverb](/advanced/pusher)), and a [lyrics overlay](/features/lyrics).

## Background

Encore started life as the Spotify companion to [Music Party](https://github.com/mintopia/musicparty),
a collaborative jukebox for LAN parties.

::: tip Not affiliated
Encore is an independent open-source project. It isn't made or endorsed by Spotify or
Raspberry Pi Ltd.
:::
