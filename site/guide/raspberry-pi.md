# Raspberry Pi & other boards

From a blank SD card to music playing, in about fifteen minutes (most of it waiting for
downloads).

## What you need

- **A 64-bit board.** Spotify only publishes Soloist for `arm64` and `x86_64`, so the board
  must support 64-bit and run a 64-bit OS. That covers Raspberry Pi boards as well as other
  single-board computers such as Orange Pi, Banana Pi, Radxa Rock and Libre Computer boards.
- **A microSD card** (8 GB or more) and a decent power supply.
- **Something to play through.** A headphone jack, HDMI, a USB DAC or a DAC HAT. Or no
  speaker at all if you'll only stream to other rooms with [Snapcast](/audio/snapcast).
- **A Spotify Premium account** and a [Soloist API key](/guide/api-key).

::: warning Unsupported Raspberry Pi models
The Raspberry Pi 1, Raspberry Pi 2, the original Pi Zero and Zero W, and the Pico can't run
a 64-bit OS, so they won't work. Every other Raspberry Pi is fine.
:::

<div class="steps">

1. **Install a 64-bit OS.**

   Any 64-bit Linux that runs Docker will do. The usual choices are:

   - **Raspberry Pi OS (64-bit)** for Raspberry Pi boards. In
     [Raspberry Pi Imager](https://www.raspberrypi.com/software/), choose your board, then a
     64-bit Raspberry Pi OS (Lite is enough). In the customisation settings, set a hostname
     (for example `encore`), a username and password, your Wi-Fi details if you're not
     using Ethernet, and **enable SSH**.
   - **[Armbian](https://www.armbian.com/)** for Orange Pi, Banana Pi and many other boards
     (and Raspberry Pi too). Download the minimal image for your board, write it with
     [balenaEtcher](https://etcher.balena.io/) or Raspberry Pi Imager, and complete the
     first-boot setup. Then set the hostname with `sudo hostnamectl set-hostname encore`.

   Write the card and boot the board.

2. **Connect over SSH.**

   ```bash
   ssh <username>@encore.local
   ```

3. **Install Docker.**

   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   ```

   Log out and back in so the group change takes effect. Check it worked with
   `docker version`.

4. **Create the Compose file.**

   ```bash
   mkdir ~/encore && cd ~/encore
   nano docker-compose.yml
   ```

   Paste this in and save:

   ```yaml
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

5. **Start it.**

   ```bash
   docker compose up -d
   ```

   The first start takes a minute or two while it downloads Soloist.
   `docker compose logs -f` shows progress.

6. **Open the console and finish setup.**

   Browse to `http://encore.local` (or the board's IP address) and follow
   [First run & pairing](/guide/first-run).

</div>

## What the Compose file does

| Line | Why it's there |
|---|---|
| `network_mode: host` | **Required.** Spotify Connect finds the device with mDNS, which doesn't cross Docker's bridge network. Host mode also lets Snapcast clients reach the board. |
| `/dev/snd` | Passes the board's sound cards into the container so you can [play through them](/audio/outputs). Not needed if you only use Snapcast. |
| `/run/udev` | Lets the container's PipeWire discover those sound cards. Harmless if absent. |
| `./config` | Holds `config.yaml`, your settings. Created on first start. |
| `soloist-data` | Soloist's session, including your Spotify login after pairing. |
| `soloist-cache` | The downloaded Soloist build. |

## Using a DAC HAT

HATs such as HiFiBerry or IQaudio boards need their device-tree overlay enabled on the host,
before Docker can see them. On Raspberry Pi OS, edit `/boot/firmware/config.txt`, add the
overlay your HAT's maker specifies, and reboot:

```ini
# Example for a HiFiBerry DAC+ / DAC2 HD class board. Check your board's docs.
dtoverlay=hifiberry-dacplus
# Optional: turn off the onboard audio so the HAT is the only card.
dtparam=audio=off
```

On Armbian, enable overlays with `sudo armbian-config` (or `/boot/armbianEnv.txt`) instead.

After a reboot, `aplay -l` on the host should list the card, and it appears in Encore under
**Audio Outputs**. See [Speakers & DACs](/audio/outputs).

## Ports

Host networking means these listen directly on the host:

| Port | What |
|---|---|
| 80 | Web console, control WebSocket and lyrics overlay |
| 1704 | Snapcast audio stream |
| 1705 | Snapcast control (JSON-RPC) |
| 1780 | Snapweb, Snapcast's web UI |

## Changing the web port

If something else already uses port 80, such as Pi-hole or a web server, set `ENCORE_PORT`
in the Compose file:

```yaml
services:
  encore:
    # ...
    environment:
      ENCORE_PORT: 8687
```

Then browse to `http://encore.local:8687`. You can also set the port with `proxy.listen` in
`config.yaml`. `ENCORE_PORT` wins if both are set.
