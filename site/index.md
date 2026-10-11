---
layout: home

hero:
  name: Encore
  text: Spotify Connect on your Raspberry Pi
  tagline: Turn a Raspberry Pi, Orange Pi, Banana Pi or any 64-bit Linux box into a Spotify speaker using Spotify's official headless player. One Docker Compose file, no PipeWire wrangling, and a web console to set it up.
  image:
    src: /logo.svg
    alt: Encore
  actions:
    - theme: brand
      text: Get started
      link: /guide/raspberry-pi
    - theme: alt
      text: What is Encore?
      link: /guide/what-is-encore
    - theme: alt
      text: GitHub
      link: https://github.com/mintopia/encore

features:
  - title: Official Spotify integration
    details: Built on Spotify Soloist, the headless Spotify Connect client Spotify publishes for developers. Your Pi shows up in the Connect menu like any other speaker.
    link: /guide/what-is-encore
    linkText: How it works
  - title: One Compose file
    details: Install Raspberry Pi OS or Armbian, add Docker and paste in one Compose file. Encore downloads Soloist, keeps it refreshed and brings its own PipeWire.
    link: /guide/raspberry-pi
    linkText: Setup guide
  - title: Web console
    details: Set your Soloist API key, device name and audio outputs from a browser. Now Playing with transport controls, plus a Debug view for when things go wrong.
    link: /features/console
    linkText: Take a look
  - title: Multi-room with Snapcast
    details: A built-in Snapcast server streams synced audio to every room. Or send the stream on to a Snapserver you already run.
    link: /audio/snapcast
    linkText: Snapcast guide
  - title: Speakers, HATs and DACs
    details: Play through the Pi's own audio, a USB DAC or a DAC HAT, alongside Snapcast, with a per-output delay for lining things up.
    link: /audio/outputs
    linkText: Audio outputs
  - title: Hooks for your own apps
    details: Authenticated control WebSocket, webhooks, an outbound relay that speaks Pusher and Laravel Reverb, and a lyrics overlay for OBS.
    link: /advanced/relay
    linkText: Advanced options
---

<div class="vp-doc" style="max-width: 960px; margin: 64px auto 0; padding: 0 24px;">

## The whole install

```yaml
# docker-compose.yml
services:
  encore:
    image: ghcr.io/mintopia/encore:latest
    network_mode: host
    restart: unless-stopped
    devices:
      - /dev/snd:/dev/snd
    volumes:
      - /run/udev:/run/udev:ro
      - ./config:/config
      - soloist-data:/data
      - soloist-cache:/cache

volumes:
  soloist-data:
  soloist-cache:
```

```bash
docker compose up -d
```

Then open `http://<your-pi>` and follow the setup page. [Full walkthrough →](/guide/raspberry-pi)

<img class="shot" src="/screenshots/landing.png" alt="Encore's Now Playing page showing the current track, transport controls and the up-next queue">

</div>
