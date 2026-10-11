# HTTPS & reverse proxies

Encore serves plain HTTP and WebSocket, on port 80 by default. That's fine on a home
network. To expose the console or overlay further, put a reverse proxy in front and
terminate TLS there.

If the reverse proxy runs on the same machine, it needs ports 80 and 443 itself, so move
Encore to another port first:

```yaml
services:
  encore:
    # ...
    environment:
      ENCORE_PORT: 8687
```

[Caddy](https://caddyserver.com/) is the simplest option, because it gets and renews
certificates automatically and proxies WebSockets with no extra config:

```txt
encore.example.com {
    reverse_proxy 127.0.0.1:8687
}
```

nginx and Traefik work too. Make sure WebSocket upgrades are passed through
(`Upgrade` and `Connection` headers in nginx).

::: tip
For a remote web app that only needs playback events and control, the
[relay](/advanced/relay) is usually simpler. The board connects out, so nothing needs to be
exposed.
:::
