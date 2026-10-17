# The public Listener sets its own volume through a Proxy-scoped JSON-RPC

The Listener is unauthenticated (like the Lyrics Overlay, ADR-0008), yet each guest must be
able to set their own volume. We chose server-side Snapcast client volume — persistent and
Snapcast-native, visible to the operator in Snapweb — over a browser-only gain node. The
problem: Snapserver's JSON-RPC control has no per-caller authorization, so handing it to
anonymous guests would let any of them set *other* clients' volumes, the group volume, or
server settings.

The Proxy mediates, so this stays safe. All Listener traffic rides through Encore's own HTTP
port (extending ADR-0007): the Proxy reverse-proxies Snapserver's `/stream` and `/jsonrpc`,
and Snapserver's `1780` need not be exposed to guests. For each Listener connection the Proxy
knows the Snapcast client id it minted for that browser (named after the guest's remote IP).
The proxied control path accepts exactly one method — `Client.SetVolume` — **scoped to that
connection's own client id**, and rejects every other method and every other id. New
Listeners default to 100%; the group/stream volume is left neutral and the slider only
attenuates the guest's own client.

## Considered Options

- **Browser-side gain only** (no server writes at all): rejected by the volume decision — it
  forfeits server-side, Snapcast-native per-client volume and operator visibility.
- **Expose Snapserver JSON-RPC directly to the browser** (as Snapweb does on a trusted LAN
  admin page): rejected — on an anonymous page it lets a guest control other clients, the
  group, and server settings.
- **Proxy-scoped single-method JSON-RPC** (chosen): keeps server-side volume while bounding
  an anonymous caller to its own client's volume and nothing else.

## Consequences

The Proxy is the security boundary for Listener control: it must enforce a method allow-list
(`Client.SetVolume` only) and own-id scoping, and must never pass a client-supplied client id
through. A future reader must not widen the proxied JSON-RPC surface for convenience. Guest
browsers register with Snapserver and appear in the operator's client list, named by remote
IP, and the operator can control them from Snapweb; Stop closes the stream socket so idle
guests drop off the list (sticky `localStorage` id preserves a returning guest's name and
volume). This is the second unauthenticated surface built on the observe-only pattern, now
extended with a single, tightly-scoped write.
