<script setup lang="ts">
import { withBase } from "vitepress";
import { PhArrowUpRight } from "@phosphor-icons/vue";
</script>

<template>
  <section class="hero">
    <div class="copy">
      <h1>Your Raspberry Pi, as a Spotify Connect speaker</h1>
      <p class="lead">
        Encore runs Spotify Soloist, Spotify's official headless player, on a Raspberry Pi,
        Orange Pi, Banana Pi or any 64-bit Linux box. One Docker Compose file, no PipeWire
        wrangling, and a web console to set it up.
      </p>
      <div class="actions">
        <a class="btn pri" :href="withBase('/guide/raspberry-pi')">Get started</a>
        <a class="btn" :href="withBase('/guide/what-is-encore')">What is Encore?</a>
        <a class="ext" href="https://github.com/mintopia/encore">
          GitHub <PhArrowUpRight :size="15" weight="fill" />
        </a>
      </div>
    </div>
    <figure class="stage">
      <img
        :src="withBase('/screenshots/now-playing-hero.webp')"
        width="1110" height="877"
        alt="Encore's Now Playing screen: album art, track title, seek bar, transport controls and the up-next queue"
      />
    </figure>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 56px;
  align-items: center;
  padding: 72px 0 40px;
}
.hero h1 {
  font-family: var(--disp);
  font-weight: 700;
  font-size: 52px;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: var(--txt);
  text-wrap: balance;
  margin: 0;
  padding: 0;
  border: 0;
}
.hero .lead {
  margin: 22px 0 0;
  max-width: 34em;
  font-size: 18px;
  line-height: 1.6;
  color: var(--dim);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 14px;
  margin-top: 32px;
}
.hero .btn {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid var(--line2);
  background: var(--card);
  color: var(--txt);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.18s, color 0.18s, background 0.18s;
}
.hero .btn:hover { border-color: var(--ind); color: var(--link); }
.hero .btn.pri { background: var(--ind); border-color: var(--ind); color: #fff; }
.hero .btn.pri:hover { background: var(--ind-h); border-color: var(--ind-h); color: #fff; }
.dark .hero .btn.pri { color: #04201d; }
.dark .hero .btn.pri:hover { color: #04201d; }
.hero .ext {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--link);
  text-decoration: none;
}
.hero .ext:hover { color: var(--ind-h); }

.stage {
  position: relative;
  margin: 0;
  padding: 18px;
  border-radius: 20px;
  background:
    radial-gradient(120% 90% at 85% 10%, rgba(45, 212, 191, 0.22), transparent 60%),
    radial-gradient(90% 80% at 10% 100%, rgba(8, 145, 178, 0.25), transparent 65%),
    #0b0f16;
  box-shadow: 0 24px 60px rgba(8, 30, 40, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dark .stage { box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
.stage img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent);
  mask-image: linear-gradient(to bottom, #000 72%, transparent);
}

@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 48px; }
  .hero h1 { font-size: 40px; }
}
@media (max-width: 480px) {
  .hero { padding: 36px 0 24px; }
  .hero h1 { font-size: 32px; }
  .hero .lead { font-size: 16px; }
  .stage { padding: 10px; border-radius: 16px; }
}
</style>
