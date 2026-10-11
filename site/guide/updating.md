# Updating

## Encore

```bash
cd ~/encore
docker compose pull
docker compose up -d
```

Your settings (`./config`) and Spotify login (`soloist-data`) are kept.

Images are tagged by version as well as `latest`, so you can pin one, for example
`ghcr.io/mintopia/encore:2` for the 2.x series.

## Soloist itself

You don't need to do anything. Spotify Soloist builds expire after 90 days. When Encore
starts, it re-downloads Soloist if the cached build is more than 60 days old, and if a build
expires while running, it fetches a fresh one and restarts automatically.
