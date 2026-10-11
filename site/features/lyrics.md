# Lyrics overlay

Encore serves a transparent, karaoke-style lyrics page you can drop into OBS, or anything
else that can overlay a web page. The page fetches synced lyrics for the current track from
[LRCLIB](https://lrclib.net/), so the machine showing it needs internet access.

```
http://<your-pi>/overlay
```

In OBS, add a **Browser** source with that URL at 1920×1080.

<img class="shot" src="/screenshots/overlay.png" alt="Lyrics overlay over a game scene">

## Styling

The **Lyrics** page has a live preview on a transparent checkerboard. You can change:

- **Layout:** alignment, anchor (top, centre, bottom), number of visible lines
- **Text:** font, size, colours for the current and other lines, dimming
- **Motion & FX:** slide, crossfade, pop or instant transitions, plus effects such as glow,
  shimmer, neon and wipe
- **Timing offset**, if lyrics run early or late

<img class="shot" src="/screenshots/lyrics.png" alt="Lyrics styling page with live preview">

## Is it safe to expose?

The overlay doesn't need a login. It uses a separate **read-only token**, embedded in the
page, which can watch playback but can't control anything. Anyone who can reach the
overlay can see what's playing, but they can't skip your tracks.

::: tip Support LRCLIB
If you find the lyrics useful, consider
[donating to LRCLIB](https://github.com/tranxuanthang/lrclib#donation).
:::
