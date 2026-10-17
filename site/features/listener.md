# Listener

The Listener is a public listen-along page for your guests. Anyone on your network can open
it on a phone or laptop to see what's playing, what's coming up and the lyrics, and tap
**Stream here** to hear the music in time with your speakers. No sign-in is needed.

```
http://<your-pi>/listen
```

<img class="shot" src="/screenshots/listener.png" alt="Listener page showing the current track, the queue and synced lyrics">

::: info Docker only
The Listener plays your [Snapcast](/audio/snapcast) stream, so it needs the Docker version
with Snapcast turned on.
:::

## What guests see

- **Now playing:** cover art, title, artists, album, and a progress bar
- **Open in Spotify:** opens the track in Spotify in a new tab
- **Queue:** everything coming up next
- **Lyrics:** synced, karaoke-style lyrics from [LRCLIB](https://lrclib.net/) that follow
  the song. Guests can collapse the panel. It only appears when lyrics exist for the track
- **Stream here:** plays the music in their browser, synced with your Snapcast speakers,
  with a volume slider of its own. **Stop** ends it
- **Light and dark themes**, switched with the button in the top corner

When nothing is playing, the page tells guests they'll hear music there once someone starts
playing.

On a phone the page stacks into a single column.

<img class="shot" src="/screenshots/listener-mobile.png" alt="Listener page on a phone" style="max-width: 360px">

## Turning it on

The Listener is off by default. Open **Settings → Listener** in the console and turn on
**Public listener page**. Turning it on or off needs a Snapcast restart: after you save, a
banner offers to **restart Snapcast**, which briefly drops audio to Snapcast clients.

<img class="shot" src="/screenshots/settings-listener.png" alt="Listener settings with display name, accent colour, link and QR code">

The same page has the **Listener link**, with a **Copy** button and a QR code. Put the QR
code on a screen so guests can scan it. The link is also in the console's menu, under
**Public listen**.

::: tip Open Settings from your network address
The link and QR code use the address you opened the console with. If you're on the Pi
itself (`localhost`), they won't work for anyone else. Open the console from another device,
using the Pi's network address, to get a link that works.
:::

## Making it yours

Both settings apply as soon as you save. Guests see the change the next time the page
loads.

- **Display name:** the title at the top of the page, such as your venue or party. Leave it
  blank to show "Encore".
- **Accent colour:** recolours the whole page: the background, panels, buttons, progress bar
  and live indicator. Pick one of the presets, or set your own colour with the hue,
  saturation and lightness sliders, a hex code or your system's colour picker. Text on
  accent-coloured buttons switches between dark and light to stay readable.

<img class="shot" src="/screenshots/listener-accent.png" alt="Listener page in the light theme with a pink accent">

## Is it safe to expose?

Guests can listen, but they can't control anything:

- The page uses the same **read-only token** as the [lyrics overlay](/features/lyrics). It
  can watch playback but can't skip, pause or change the queue.
- **Stream here** volume only changes that guest's own stream. It never changes the Spotify
  volume or anyone else's.
- Everything goes through Encore's own port. Snapcast's web port (`1780`) isn't opened for
  the Listener.

Each guest who streams shows up as a Snapcast client named after their IP address, so you
can see and adjust them in [Snapweb](/audio/snapcast#snapweb). They drop off the list when
they press **Stop** or close the page.

## Configuration

In `config.yaml`, under `snapcast`:

```yaml
snapcast:
  listener: true                  # serve the Listener at /listen
  listener_display_name: ""       # title on the page; blank shows "Encore"
  listener_accent: ""             # accent as #rrggbb; blank is Encore teal
```
