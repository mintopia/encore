<script setup lang="ts">
import { withBase } from "vitepress";

const steps = [
  {
    title: "Install a 64-bit OS",
    text: "Raspberry Pi OS or Armbian, then Docker.",
    link: "/guide/raspberry-pi",
  },
  {
    title: "Start the container",
    text: "Paste one Compose file and start it with Docker Compose.",
    link: "/guide/raspberry-pi#what-the-compose-file-does",
  },
  {
    title: "Pick it in Spotify",
    text: "Add your Soloist API key, then choose the device from any Spotify app on your network.",
    link: "/guide/first-run",
  },
];
</script>

<template>
  <section class="home-steps" aria-labelledby="steps-title">
    <h2 id="steps-title">Three steps to music</h2>
    <ol>
      <li v-for="s in steps" :key="s.title">
        <a :href="withBase(s.link)">
          <span class="title">{{ s.title }}</span>
          <span class="text">{{ s.text }}</span>
        </a>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.home-steps { padding: 16px 0 8px; }
.home-steps h2 {
  font-family: var(--disp);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.015em;
  margin: 0 0 20px;
  color: var(--txt);
}
.home-steps ol {
  counter-reset: step;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.home-steps li { counter-increment: step; margin: 0; }
.home-steps li + li { border-left: 1px solid var(--line); }
.home-steps a {
  display: grid;
  grid-template-columns: 32px 1fr;
  column-gap: 14px;
  row-gap: 4px;
  align-content: start;
  height: 100%;
  padding: 6px 22px 6px 0;
  text-decoration: none;
  color: inherit;
}
.home-steps li + li a { padding-left: 22px; }
.home-steps a::before {
  content: counter(step);
  grid-row: span 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--ind-s);
  color: var(--link);
  font: 700 14px/1 var(--disp);
  font-variant-numeric: tabular-nums;
}
.home-steps .title {
  font-family: var(--disp);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--txt);
  transition: color 0.18s;
}
.home-steps a:hover .title { color: var(--link); }
.home-steps .text { font-size: 14px; line-height: 1.55; color: var(--dim); }

@media (max-width: 760px) {
  .home-steps ol { grid-template-columns: 1fr; }
  .home-steps li + li { border-left: 0; border-top: 1px solid var(--line); }
  .home-steps li + li a { padding-left: 0; }
  .home-steps a { padding: 16px 0; }
}
</style>
