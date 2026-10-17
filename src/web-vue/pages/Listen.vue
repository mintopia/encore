<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { readTrack, readPlayback, applyAnchor, nowMs, fmtTime, type Track } from "../lib/wire";

const boot = (window as unknown as { __SOLOIST_LISTEN__?: { token?: string } }).__SOLOIST_LISTEN__;

const track = ref<Track | null>(null);
const anchor = reactive({ anchorMs: 0, anchorAt: 0, speed: 0 });
const positionMs = ref(0);

const durationMs = computed(() => track.value?.durationMs ?? 0);
const pct = computed(() => (durationMs.value > 0 ? Math.min(100, (positionMs.value / durationMs.value) * 100) : 0));

function onFrame(msg: any) {
  const t = readTrack(msg);
  if (t) track.value = t;
  applyAnchor(anchor, readPlayback(msg));
}

let ws: WebSocket | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let tick: ReturnType<typeof setInterval> | undefined;
let backoffMs = 1000;
let closed = false;

function connect() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${proto}//${location.host}/?token=${encodeURIComponent(boot?.token ?? "")}`);
  ws.onopen = () => { backoffMs = 1000; };
  ws.onmessage = (ev) => {
    let msg: any;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg && typeof msg === "object" && !Array.isArray(msg)) onFrame(msg);
  };
  ws.onclose = () => {
    if (closed) return;
    anchor.anchorMs = nowMs(anchor);
    anchor.anchorAt = Date.now();
    anchor.speed = 0;
    timer = setTimeout(connect, backoffMs);
    backoffMs = Math.min(backoffMs * 2, 15000);
  };
  ws.onerror = () => ws?.close();
}

onMounted(() => {
  connect();
  tick = setInterval(() => {
    positionMs.value = Math.max(0, durationMs.value ? Math.min(durationMs.value, nowMs(anchor)) : nowMs(anchor));
  }, 250);
});
onUnmounted(() => {
  closed = true;
  clearTimeout(timer);
  clearInterval(tick);
  ws?.close();
});
</script>

<template>
  <main class="listen">
    <h1 class="wordmark">Encore</h1>
    <section class="frame" aria-label="Now playing">
      <img v-if="track?.art" class="art" :src="track.art" alt="" />
      <div v-else class="art" aria-hidden="true"></div>
      <template v-if="track">
        <div class="meta">
          <p class="title">{{ track.title }}</p>
          <p class="artist">{{ track.artist }}</p>
          <p v-if="track.album" class="album">{{ track.album }}</p>
        </div>
        <div class="progress">
          <div
            class="bar"
            role="progressbar"
            aria-label="Playback position"
            aria-valuemin="0"
            :aria-valuemax="Math.round(durationMs / 1000)"
            :aria-valuenow="Math.round(positionMs / 1000)"
          >
            <div class="fill" :style="{ width: pct + '%' }"></div>
          </div>
          <div class="times"><span>{{ fmtTime(positionMs) }}</span><span>{{ fmtTime(durationMs) }}</span></div>
        </div>
      </template>
      <p v-else class="idle">Nothing playing</p>
    </section>
  </main>
</template>

<style scoped>
.listen { min-height: 100%; display: grid; place-content: center; justify-items: center; gap: 28px; padding: 24px; }
.wordmark { margin: 0; font-family: var(--disp); font-weight: 700; font-size: 28px; letter-spacing: -0.01em; color: var(--txt); }
.frame { width: min(360px, 100%); background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh2); padding: 20px; display: grid; gap: 16px; }
.art { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; background: var(--sub); border: 1px solid var(--line); }
.meta { display: grid; gap: 4px; text-align: center; }
.meta p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title { font-family: var(--disp); font-weight: 700; font-size: 18px; color: var(--txt); }
.artist { font-size: 14px; color: var(--txt); }
.album { font-size: 13px; color: var(--dim); }
.progress { display: grid; gap: 6px; }
.bar { height: 4px; border-radius: 2px; background: var(--sub); overflow: hidden; }
.fill { height: 100%; background: var(--ind); }
.times { display: flex; justify-content: space-between; font-size: 12px; color: var(--dim); font-variant-numeric: tabular-nums; }
.idle { margin: 0; text-align: center; color: var(--dim); font-size: 14px; }
</style>
