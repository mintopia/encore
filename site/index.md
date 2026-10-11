---
layout: home
title: Encore
titleTemplate: Spotify Connect for your Raspberry Pi
---

<HomeHero />

<HomeSteps />

<div class="home-install">

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

Then open `http://<your-pi>` and follow the setup page. [Full walkthrough](/guide/raspberry-pi)

</div>

<HomeFeatures />
