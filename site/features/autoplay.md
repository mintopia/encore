# Autoplay

Turn on **Autoplay on login** in **Settings → Soloist** and, as soon as Soloist logs in to
Spotify, Encore makes it the active Connect device and starts playing.

Use it for a speaker that should start playing as soon as it powers up, like one in a
shop or an always-on kitchen speaker.

Activating a Connect device normally resets its volume to 100%. Encore restores the last
volume Soloist reported, so a reboot doesn't blast you.

In `config.yaml`:

```yaml
autoplay: true
```
