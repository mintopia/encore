<script setup lang="ts">
import { withBase } from "vitepress";
import {
  PhSpotifyLogo,
  PhSlidersHorizontal,
  PhBroadcast,
  PhSpeakerHifi,
  PhMicrophoneStage,
  PhPlugs,
} from "@phosphor-icons/vue";

const features = [
  {
    icon: PhSpotifyLogo,
    title: "Spotify's own client",
    text: "Built on Spotify Soloist, the headless Spotify Connect client Spotify publishes for developers. Your Pi shows up in the Connect menu like any other speaker.",
    link: "/guide/what-is-encore",
  },
  {
    icon: PhSlidersHorizontal,
    title: "Web console",
    text: "Set your Soloist API key, device name and audio outputs from a browser. Now Playing with transport controls, plus a Debug view for when things go wrong.",
    link: "/features/console",
  },
  {
    icon: PhBroadcast,
    title: "Multi-room with Snapcast",
    text: "A built-in Snapcast server streams synced audio to every room, or sends it on to a Snapserver you already run.",
    link: "/audio/snapcast",
  },
  {
    icon: PhSpeakerHifi,
    title: "Speakers, HATs and DACs",
    text: "Play through the board's own audio, a USB DAC or a DAC HAT alongside Snapcast, with a per-output delay for lining rooms up.",
    link: "/audio/outputs",
  },
  {
    icon: PhMicrophoneStage,
    title: "Lyrics overlay",
    text: "Synced, karaoke-style lyrics on a transparent page for OBS, styled from the console with a live preview.",
    link: "/features/lyrics",
  },
  {
    icon: PhPlugs,
    title: "Hooks for your own apps",
    text: "A token-authenticated control WebSocket, webhooks, and an outbound relay that speaks Pusher and Laravel Reverb.",
    link: "/advanced/relay",
  },
];
</script>

<template>
  <section class="home-features" aria-labelledby="features-title">
    <h2 id="features-title">What you get</h2>
    <ul>
      <li v-for="f in features" :key="f.title">
        <a :href="withBase(f.link)">
          <span class="icon"><component :is="f.icon" :size="19" weight="fill" /></span>
          <span class="body">
            <span class="title">{{ f.title }}</span>
            <span class="text">{{ f.text }}</span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.home-features { padding: 24px 0 96px; }
.home-features h2 {
  font-family: var(--disp);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.015em;
  margin: 0 0 20px;
  color: var(--txt);
}
.home-features ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 48px;
}
.home-features li { margin: 0; border-bottom: 1px solid var(--line); }
.home-features a {
  display: flex;
  gap: 16px;
  padding: 22px 0;
  text-decoration: none;
  color: inherit;
}
.home-features .icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--ind-s);
  color: var(--link);
}
.home-features .body { display: grid; gap: 4px; }
.home-features .title {
  font-family: var(--disp);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--txt);
  transition: color 0.18s;
}
.home-features a:hover .title { color: var(--link); }
.home-features .text { font-size: 14px; line-height: 1.6; color: var(--dim); max-width: 46ch; }

@media (max-width: 760px) {
  .home-features ul { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .home-features { padding-bottom: 64px; }
}
</style>
