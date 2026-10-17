# 0031 — The Listener sets only its own volume through a one-method allow-listed /jsonrpc

Status: accepted

The Listener (ADR-0028) gets a volume slider that changes only that guest's Snapcast client volume.

- The Proxy reverse-proxies Snapserver's `POST /jsonrpc` for the Listener (only when `snapcast.listener` is on) and accepts exactly one call: `Client.SetVolume` whose `params.id` equals the caller's own client id. Everything else — other methods, other ids, batches, malformed or oversize bodies — is rejected with 403. The forwarded body is re-serialised from the validated fields.
- The Proxy mints the client id (`uuid.hmac`, signed with the session secret) via `GET /listen/identity`, and the Listener sends it in `X-Encore-Listener`. A guest can't forge another client's id, so SetVolume can't be aimed at it.
- The identity endpoint also returns the client name, "Encore Listener — <remote IP>", read off the proxied connection, so the name is not guest-chosen. The id is kept in `localStorage`, so a returning guest keeps name and volume (Snapserver persists per-client volume; new clients start at 100%).
- The client applies Snapserver's `ServerSettings` volume to its gain node. Stop closes the stream socket, so the client drops off the operator's list.
