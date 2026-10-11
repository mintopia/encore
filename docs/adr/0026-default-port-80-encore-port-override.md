# The Proxy defaults to port 80, with an ENCORE_PORT override

The Proxy serves the web console and control WebSocket on port **80**, so the console is
just `http://<host>` on a dedicated Pi. `DEFAULT_PROXY_LISTEN` and the seeded
`config.example.yaml` both use `0.0.0.0:80`.

The port can be changed two ways: `proxy.listen` in the Config File, as before, or the
**`ENCORE_PORT`** environment variable. This amends ADR-0010's "no environment configuration"
rule with one narrow exception. `ENCORE_PORT` overrides only the port, keeps the host from
`proxy.listen`, and is applied only at bind time (`effectiveListen` in `proxy.ts`). It is
never merged into the loaded config, so a UI save can't write it back into the file. That
round-trip ambiguity is what ADR-0010 removed env to avoid. `proxy.listen` was already
hand-edit-only and isn't shown in the UI, so there's no displayed value to disagree with.

## Considered Options

- **Config only**: rejected. Changing the port in Docker would mean editing a file inside
  the bind mount before first boot. An environment line in the Compose file is the
  expected way to do that.
- **Generic `PORT`**: rejected. Dev shells and PaaS tooling often set `PORT`, which would
  silently move a standalone install.
- **Keep 8687**: rejected. A dedicated appliance should answer on the default HTTP port.

## Consequences

- The Docker `HEALTHCHECK` no longer hardcodes a port. `dist/healthcheck.js` loads the
  Config File, applies `ENCORE_PORT` and connects to the port the Proxy actually binds.
- Port 80 needs root. Docker runs as root under s6, so that's fine. In standalone (`npx`), a
  normal user gets `EACCES`, which is reported as a clear error suggesting `ENCORE_PORT` or
  `proxy.listen`.
- Port 80 can clash with other services on the host (Pi-hole, a web server).
  `EADDRINUSE` gets the same clear error, and the docs say to set `ENCORE_PORT`.
