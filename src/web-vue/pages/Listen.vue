<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { readTrack, readPlayback, readQueue, applyAnchor, nowMs, fmtTime, type Track } from "../lib/wire";
import { SnapClient, type SnapState } from "../lib/snapclient";
import { currentIndex, fetchSyncedLyrics, type LyricLine } from "../lib/overlay-engine";

const boot = (window as unknown as { __SOLOIST_LISTEN__?: { token?: string } }).__SOLOIST_LISTEN__;

const track = ref<Track | null>(null);
const queue = ref<Track[]>([]);
const lyricsOpen = ref(false);
const lyrics = ref<LyricLine[]>([]);
const lyricsEl = ref<HTMLElement>();
const anchor = reactive({ anchorMs: 0, anchorAt: 0, speed: 0 });
const positionMs = ref(0);

const durationMs = computed(() => track.value?.durationMs ?? 0);
const pct = computed(() => (durationMs.value > 0 ? Math.min(100, (positionMs.value / durationMs.value) * 100) : 0));

const lyricIdx = computed(() => (lyrics.value.length ? currentIndex(lyrics.value, positionMs.value / 1000) : -1));

function trackKey(t: Track) { return t.uri || `${t.artist}|${t.title}`; }

watch(track, async (t, prev) => {
  if (t && prev && trackKey(t) === trackKey(prev)) return;
  lyrics.value = [];
  if (!t) return;
  const key = trackKey(t);
  let lines: LyricLine[] | null = null;
  try { lines = await fetchSyncedLyrics(t); } catch { lines = null; }
  if (track.value && trackKey(track.value) === key) lyrics.value = lines || [];
});

watch(lyricIdx, () => {
  if (!lyricsOpen.value) return;
  nextTick(() => lyricsEl.value?.querySelector(".cur")?.scrollIntoView({ block: "center", behavior: "smooth" }));
});

function onFrame(msg: any) {
  const t = readTrack(msg);
  if (t) track.value = t;
  const q = readQueue(msg);
  if (q) queue.value = q;
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

const snapState = ref<SnapState>("idle");
const snapDetail = ref("");
const snap = new SnapClient(
  {
    onState(s, d) {
      snapState.value = s;
      snapDetail.value = d ?? "";
    },
  },
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/stream`,
);
const snapActive = computed(() => snapState.value === "connecting" || snapState.value === "playing");
const snapLabel = computed(() => {
  if (snapState.value === "connecting") return "Connecting…";
  if (snapState.value === "playing") return "Playing";
  if (snapState.value === "error") return snapDetail.value || "Couldn't play the stream";
  return "";
});

function toggleSnap() {
  if (snapActive.value) snap.stop();
  else snap.start();
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
  snap.stop();
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
      <p v-if="snapLabel" class="idle" :class="{ err: snapState === 'error' }" role="status">{{ snapLabel }}</p>
      <button type="button" class="go" :class="{ stop: snapActive }" @click="toggleSnap">{{ snapActive ? "Stop" : "Start" }}</button>
    </section>

    <section v-if="track && lyrics.length" class="panel" aria-label="Lyrics">
      <button type="button" class="toggle" :aria-expanded="lyricsOpen" @click="lyricsOpen = !lyricsOpen">
        Lyrics <span aria-hidden="true">{{ lyricsOpen ? "−" : "+" }}</span>
      </button>
      <div v-if="lyricsOpen" ref="lyricsEl" class="lyrics">
        <p v-for="(l, i) in lyrics" :key="i" class="line" :class="{ cur: i === lyricIdx }">{{ l.text || "♪" }}</p>
      </div>
    </section>

    <section v-if="queue.length" class="panel" aria-label="Up next">
      <h2 class="up">Up next</h2>
      <ol class="queue">
        <li v-for="(q, i) in queue" :key="i">
          <span class="qt">{{ q.title }}</span>
          <span class="qa">{{ q.artist }}</span>
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
.listen { min-height: 100%; display: grid; place-content: center; justify-items: center; gap: 28px; padding: 24px; }
.wordmark { margin: 0; font-family: var(--disp); font-weight: 700; font-size: 28px; letter-spacing: -0.01em; color: var(--txt); }
.panel { width: min(360px, 100%); background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh2); padding: 16px 20px; }
.toggle { all: unset; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; cursor: pointer; font-family: var(--disp); font-weight: 700; font-size: 15px; color: var(--txt); }
.lyrics { margin-top: 12px; max-height: 240px; overflow-y: auto; display: grid; gap: 6px; text-align: center; }
.line { margin: 0; font-size: 14px; color: var(--dim); }
.line.cur { color: var(--txt); font-weight: 700; }
.up { margin: 0 0 8px; font-family: var(--disp); font-weight: 700; font-size: 15px; color: var(--txt); }
.queue { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.queue li { display: grid; gap: 1px; min-width: 0; }
.qt { font-size: 14px; color: var(--txt); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa { font-size: 12px; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
.idle.err { color: var(--bad); }
.go { font: inherit; font-weight: 600; font-size: 15px; padding: 12px 16px; border: 0; border-radius: 12px; cursor: pointer; background: var(--ind); color: var(--on-ind); }
.go:hover { background: var(--ind-h); }
.go.stop { background: var(--sub); color: var(--txt); border: 1px solid var(--line2); }
.go:focus-visible { outline: 2px solid var(--ind); outline-offset: 2px; }
</style>
