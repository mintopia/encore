# Encore: Spotify Soloist + auth Proxy + PipeWire + Snapserver, supervised by s6.
# s6-overlay is PID 1: it reaps zombies and supervises/restarts the Node app.
# Run with host networking so the Proxy (port 80 by default) is reachable from the LAN.
# Debian trixie (glibc 2.41): the Soloist binary needs GLIBC_2.38+, which bookworm
# (2.36) does not have. Alpine is ruled out — Soloist is a glibc binary and the
# pipewire-enabled Snapserver ships only as a .deb.
FROM node:24-trixie-slim

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Bumping this means updating the pinned tarball hashes below too.
ARG S6_OVERLAY_VERSION=3.2.3.2
ARG TARGETARCH

# s6-overlay (arch tarball + noarch tarball). curl+xz only needed for this fetch.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends curl xz-utils ca-certificates; \
    case "${TARGETARCH:-amd64}" in \
      amd64) S6_ARCH=x86_64;  S6_SHA=e6befcc96a437a3831386ecfc51808c5d3e939dc5fe3c02ae9284599e8aa2408 ;; \
      arm64) S6_ARCH=aarch64; S6_SHA=b17f17a82e7a515c682a91edaf2ffdabb73f891981b6c1fd712115693a2f8b4c ;; \
      arm)   S6_ARCH=arm;     S6_SHA=9fc621c84370ab8fdf72dee51ba16c85a882d01bd2f3b388f8e1ee6bc03e00d3 ;; \
      *) echo "unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    base="https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}"; \
    curl -fsSL "${base}/s6-overlay-noarch.tar.xz"      -o /tmp/s6-noarch.tar.xz; \
    curl -fsSL "${base}/s6-overlay-${S6_ARCH}.tar.xz"  -o /tmp/s6-arch.tar.xz; \
    echo "5379750ed30a84bbd2e2dd74847ba6b5bd29cd0b2e3ea2ec58049b57eb2eda12  /tmp/s6-noarch.tar.xz" | sha256sum -c -; \
    echo "${S6_SHA}  /tmp/s6-arch.tar.xz" | sha256sum -c -; \
    tar -C / -Jxpf /tmp/s6-noarch.tar.xz; \
    tar -C / -Jxpf /tmp/s6-arch.tar.xz; \
    apt-get purge -y curl xz-utils; \
    apt-get autoremove -y; \
    rm -rf /tmp/s6-*.tar.xz /var/lib/apt/lists/*
# ca-certificates stays: the runtime Soloist binary download is HTTPS.

# Audio path (ticket 06): PipeWire null-sink Soloist plays into, WirePlumber to
# route the stream onto it, and the pw-* CLI used to probe the sink at startup.
# dbus: WirePlumber runs under a private session bus (reserve-device /
# portal-permissionstore plugins need one); machine-id lets that bus start.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends pipewire pipewire-bin wireplumber dbus libatomic1; \
    dbus-uuidgen --ensure=/etc/machine-id; \
    rm -rf /var/lib/apt/lists/*
COPY docker/pipewire/soloist-sink.conf /etc/pipewire/pipewire.conf.d/10-soloist-sink.conf
COPY docker/pipewire/no-desktop-modules.conf /etc/pipewire/pipewire.conf.d/20-no-desktop-modules.conf
COPY docker/wireplumber/80-disable-bluez.conf /etc/wireplumber/wireplumber.conf.d/80-disable-bluez.conf
COPY docker/wireplumber/81-full-sink-volume.conf /etc/wireplumber/wireplumber.conf.d/81-full-sink-volume.conf
COPY docker/wireplumber/82-disable-libcamera.conf /etc/wireplumber/wireplumber.conf.d/82-disable-libcamera.conf

# Snapserver (ticket 07): serves the captured audio to LAN Snapclients. Must be a
# pipewire-enabled build — default packages ship BUILD_WITH_PIPEWIRE=OFF, so we
# install the release's *_with-pipewire .deb and assert the linkage at build time
# (ADR-0002). apt resolves the .deb's runtime deps.
ARG SNAPCAST_VERSION=0.35.0
ARG SNAPSERVER_SHA256_AMD64=7e89b5813f24c55bfa5021eb7e5a4ea6978fdcc6d793333eef129ee7b5e82b1b
ARG SNAPSERVER_SHA256_ARM64=ed92a14388efafd0bba5e3077d59d351a86ef62acb6dbd458f45e9c559ed5a1f
ARG SNAPSERVER_SHA256_ARMHF=7f5ef8020122d4082fc6da8ec0947aa7a1f2360c43e999ccccc699a87f7f4923
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends curl ca-certificates; \
    case "${TARGETARCH:-amd64}" in \
      amd64) SNAP_ARCH=amd64; SNAP_SHA=${SNAPSERVER_SHA256_AMD64} ;; \
      arm64) SNAP_ARCH=arm64; SNAP_SHA=${SNAPSERVER_SHA256_ARM64} ;; \
      arm)   SNAP_ARCH=armhf; SNAP_SHA=${SNAPSERVER_SHA256_ARMHF} ;; \
      *) echo "unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    deb="snapserver_${SNAPCAST_VERSION}-1_${SNAP_ARCH}_trixie_with-pipewire.deb"; \
    curl -fsSL "https://github.com/badaix/snapcast/releases/download/v${SNAPCAST_VERSION}/${deb}" -o /tmp/snapserver.deb; \
    echo "${SNAP_SHA}  /tmp/snapserver.deb" | sha256sum -c -; \
    apt-get install -y --no-install-recommends /tmp/snapserver.deb; \
    ldd "$(command -v snapserver)" | grep -q pipewire; \
    apt-get purge -y curl; \
    apt-get autoremove -y; \
    rm -rf /tmp/snapserver.deb /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json tsconfig.json vite.config.ts ./
RUN npm ci
COPY src ./src
# tsc (server) + vite build (Vue web UI, ADR-0014); prune drops the build toolchain
# so the runtime image still runs `node dist/main.js` with no toolchain present.
RUN npm run build && npm prune --omit=dev

# Packaged starter config. Not the live file: docker-compose bind-mounts /config,
# and the soloist-proxy service seeds /config/config.yaml from this on first boot
# (ADR-0010 — the Config File is the single source of truth, no env).
COPY config.example.yaml ./config.example.yaml
COPY docker/scripts/wait-for-sink /usr/local/bin/wait-for-sink
RUN chmod +x /usr/local/bin/wait-for-sink
COPY docker/s6-rc.d /etc/s6-overlay/s6-rc.d
COPY docker/user-bundles.d /etc/s6-overlay/user-bundles.d
RUN chmod +x /etc/s6-overlay/s6-rc.d/soloist-proxy/run \
             /etc/s6-overlay/s6-rc.d/pipewire/run \
             /etc/s6-overlay/s6-rc.d/wireplumber/run \
             /etc/s6-overlay/s6-rc.d/snapserver/run

# Config File is bind-mounted at /config (ADR-0010); data-dir (/data) comes from it.
# SOLOIST_CACHE_DIR: infra path for the downloaded-binary cache (not app config).
# XDG_RUNTIME_DIR: where PipeWire puts its socket; every client inherits it.
ENV SOLOIST_CACHE_DIR=/cache \
    XDG_RUNTIME_DIR=/run/pipewire
VOLUME ["/config", "/data", "/cache"]

# 80 Proxy (proxy.listen / ENCORE_PORT); 1704 Snapcast stream, 1705 Snapcast control, 1780 Snapcast web UI
# (host networking, so these are documentation — the ports bind on the host directly).
EXPOSE 80 1704 1705 1780
# start-period covers the Proxy's wait-for-sink (up to ~30s) before it binds.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD ["node", "dist/healthcheck.js", "/config/config.yaml"]

ENTRYPOINT ["/init"]
