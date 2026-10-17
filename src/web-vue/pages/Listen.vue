<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { readTrack, readPlayback, readQueue, applyAnchor, nowMs, fmtTime, type Track } from "../lib/wire";
import { SnapClient, type SnapState } from "../lib/snapclient";
import { PhSun, PhMoon, PhHeadphones, PhStop, PhSpeakerSimpleHigh, PhSpotifyLogo, PhVinylRecord, PhCaretDown } from "@phosphor-icons/vue";
import SiteFooter from "../components/SiteFooter.vue";
import { hexToHsl, luminance } from "../lib/color";
import { useTheme } from "../composables/useTheme";
import { currentIndex, fetchSyncedLyrics, type LyricLine } from "../lib/overlay-engine";

const boot = (window as unknown as { __SOLOIST_LISTEN__?: { token?: string; displayName?: string; accent?: string } }).__SOLOIST_LISTEN__;

const track = ref<Track | null>(null);
const queue = ref<Track[]>([]);
const lyricsOpen = ref(false);
const lyrics = ref<LyricLine[]>([]);
const lyricsEl = ref<HTMLElement>();
const { theme, toggle: toggleTheme } = useTheme();
const wsUp = ref(false);
const anchor = reactive({ anchorMs: 0, anchorAt: 0, speed: 0 });
const positionMs = ref(0);

const durationMs = computed(() => track.value?.durationMs ?? 0);
const pct = computed(() => (durationMs.value > 0 ? Math.min(100, (positionMs.value / durationMs.value) * 100) : 0));

const ACCENT = /^#[0-9a-f]{6}$/i.test(boot?.accent ?? "") ? boot!.accent! : "#14b8a6";
const spotifyId = computed(() => /^spotify:track:([A-Za-z0-9]+)$/.exec(track.value?.uri ?? "")?.[1] ?? "");
const spotifyUrl = computed(() => (spotifyId.value ? `https://open.spotify.com/track/${spotifyId.value}` : ""));

const sceneVars = computed(() => {
  const [h, s] = hexToHsl(ACCENT);
  const sat = Math.min(s, 55);
  const dark = (hueShift: number, l: number) => `hsl(${(h + hueShift + 360) % 360} ${sat}% ${l}%)`;
  return {
    "--ac": ACCENT,
    "--ac-ink": luminance(ACCENT) > 0.4 ? "#06231f" : "#fff",
    "--ac-hero-a": dark(-8, 11),
    "--ac-hero-b": dark(6, 14),
    "--ac-panel-a": dark(-6, 10),
    "--ac-panel-b": dark(4, 13),
    "--ac-bloom": `hsl(${h} ${s}% 45% / .32)`,
    "--ac-bloom-2": `hsl(${(h + 20) % 360} ${s}% 45% / .22)`,
  };
});

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
  ws.onopen = () => { backoffMs = 1000; wsUp.value = true; };
  ws.onmessage = (ev) => {
    let msg: any;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg && typeof msg === "object" && !Array.isArray(msg)) onFrame(msg);
  };
  ws.onclose = () => {
    wsUp.value = false;
    if (closed) return;
    anchor.anchorMs = nowMs(anchor);
    anchor.anchorAt = Date.now();
    anchor.speed = 0;
    timer = setTimeout(connect, backoffMs);
    backoffMs = Math.min(backoffMs * 2, 15000);
  };
  ws.onerror = () => ws?.close();
}

const volume = ref(100);
const snapState = ref<SnapState>("idle");
let streamTimer: ReturnType<typeof setTimeout> | undefined;
let streamBackoffMs = 1000;
const snap = new SnapClient(
  {
    onState(s, d) {
      snapState.value = s;
      if (s === "playing") streamBackoffMs = 1000;
      if (s === "error" && wantStream.value && !closed) {
        streamTimer = setTimeout(() => { if (wantStream.value) snap.start(); }, streamBackoffMs);
        streamBackoffMs = Math.min(streamBackoffMs * 2, 15000);
      }
    },
    onVolume(p) {
      volume.value = p;
    },
  },
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/stream`,
);
const wantStream = ref(false);
const snapActive = computed(() => wantStream.value);
const statusText = computed(() => (!track.value ? "Idle" : anchor.speed > 0 ? "Playing" : "Paused"));
const reconnecting = computed(() => !wsUp.value || (wantStream.value && snapState.value === "error"));
const idle = computed(() => !track.value);
const snapLabel = computed(() => {
  if (reconnecting.value) return "Reconnecting…";
  if (snapState.value === "connecting") return "Connecting…";
  if (snapState.value === "playing") return "Playing";
  if (track.value && !wantStream.value) return "Tap Stream here to listen";
  return "";
});

function onVolume(e: Event) {
  const p = Number((e.target as HTMLInputElement).value);
  volume.value = p;
  snap.setVolume(p);
}

function toggleSnap() {
  clearTimeout(streamTimer);
  streamBackoffMs = 1000;
  wantStream.value = !wantStream.value;
  if (wantStream.value) snap.start();
  else snap.stop();
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
  clearTimeout(streamTimer);
  clearInterval(tick);
  ws?.close();
  snap.stop();
});
</script>

<template>
  <div class="scene" :style="sceneVars">
    <div class="bloom bloom-a" aria-hidden="true"></div>
    <div class="bloom bloom-b" aria-hidden="true"></div>
    <main class="listen">
      <header class="top">
        <div class="brand">
          <span class="tile" aria-hidden="true"><PhVinylRecord :size="18" weight="fill" /></span>
          <h1 class="wordmark">{{ boot?.displayName || "Encore" }}</h1>
        </div>
        <button type="button" class="theme" :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
          <PhSun v-if="theme === 'dark'" :size="18" weight="fill" />
          <PhMoon v-else :size="18" weight="fill" />
        </button>
      </header>

      <div class="deck">
        <section class="hero" aria-label="Now playing">
          <div class="hero-inner">
            <img v-if="track?.art" class="art" :src="track.art" alt="" />
            <div v-else class="art" aria-hidden="true"></div>
            <div class="meta">
              <div class="status-row">
                <span class="dot" :class="{ live: track && anchor.speed > 0 }"></span>
                <span class="status">{{ statusText }}</span>
              </div>
              <template v-if="track">
                <p class="title">{{ track.title }}</p>
                <p class="artist">{{ [track.artist, track.album].filter(Boolean).join(" — ") }}</p>
                <span v-if="track.album" class="chip"><PhVinylRecord :size="16" weight="fill" />{{ track.album }}</span>
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
              <p v-else class="idle-copy">When someone starts to play music, you'll hear it here.</p>
              <p v-if="snapLabel" class="snap" :class="{ err: snapState === 'error' }" role="status">{{ snapLabel }}</p>
              <div class="tune">
                <button type="button" class="go" :class="{ stop: snapActive }" :disabled="idle && !snapActive" @click="toggleSnap">
                  <PhStop v-if="snapActive" :size="18" weight="fill" />
                  <PhHeadphones v-else :size="18" weight="fill" />
                  {{ snapActive ? "Stop" : "Stream here" }}
                </button>
                <div class="vol">
                  <PhSpeakerSimpleHigh :size="18" weight="fill" aria-hidden="true" />
                  <input type="range" min="0" max="100" step="1" :value="volume" aria-label="Your volume" @input="onVolume" />
                </div>
                <a v-if="spotifyUrl" class="spot" :href="spotifyUrl" target="_blank" rel="noopener">
                  <PhSpotifyLogo :size="18" weight="fill" />Open in Spotify
                </a>
              </div>
            </div>
          </div>
        </section>

        <aside class="rail" aria-label="Queue">
          <div class="qhead">
            <h2 class="qlabel">Queue</h2>
            <span class="qcount">{{ queue.length }}</span>
          </div>
          <ol v-if="queue.length" class="queue">
            <li v-for="(q, i) in queue" :key="i">
              <img v-if="q.art" class="qart" :src="q.art" alt="" />
              <span v-else class="qart" aria-hidden="true"></span>
              <span class="qmeta">
                <span class="qt">{{ q.title }}</span>
                <span class="qa">{{ q.artist }}</span>
              </span>
              <span class="qd">{{ q.durationMs ? fmtTime(q.durationMs) : "" }}</span>
            </li>
          </ol>
          <p v-else class="qempty">Queue is empty.</p>
        </aside>
      </div>

      <section v-if="track && lyrics.length" class="lyr" aria-label="Lyrics">
        <button type="button" class="toggle" :aria-expanded="lyricsOpen" @click="lyricsOpen = !lyricsOpen">
          Lyrics <PhCaretDown :size="16" weight="fill" class="caret" :class="{ open: lyricsOpen }" aria-hidden="true" />
        </button>
        <div v-if="lyricsOpen" ref="lyricsEl" class="lyrics">
          <p v-for="(l, i) in lyrics" :key="i" class="line" :class="{ cur: i === lyricIdx }">{{ l.text || "♪" }}</p>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.scene {
  --h-fg: #fff; --h-fg2: rgba(255,255,255,.72); --h-fg3: rgba(255,255,255,.6); --h-fg4: rgba(255,255,255,.55);
  --h-track: rgba(255,255,255,.16); --h-hair: rgba(255,255,255,.10);
  position: relative; min-height: 100%; display: flex; flex-direction: column; overflow-x: clip;
}
.bloom { position: fixed; width: 560px; height: 560px; border-radius: 50%; pointer-events: none; }
.bloom-a { left: -180px; top: -240px; background: radial-gradient(circle, var(--ac-bloom), transparent 64%); }
.bloom-b { right: -200px; bottom: -260px; background: radial-gradient(circle, var(--ac-bloom-2), transparent 64%); }
.listen { position: relative; flex: 1; width: min(1180px, 100%); margin: 0 auto; padding: 24px; display: grid; align-content: start; gap: 24px; }
.top { display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 10px; }
.tile { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--ac); color: var(--ac-ink); }
.wordmark { margin: 0; font-family: var(--disp); font-weight: 700; font-size: 26px; letter-spacing: -0.01em; color: var(--txt); }
.theme { display: grid; place-items: center; padding: 0; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; background: var(--card); color: var(--txt); border: 1px solid var(--line); }
.theme:focus-visible, .go:focus-visible, .spot:focus-visible, .toggle:focus-visible, .vol input:focus-visible { outline: 2px solid var(--ac); outline-offset: 3px; }

.deck { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
.hero, .rail, .lyr {
  position: relative; border-radius: 20px; overflow: hidden; border: 1px solid var(--h-hair); color: var(--h-fg);
  box-shadow: 0 22px 54px rgba(4, 18, 30, .34);
}
.hero { background: linear-gradient(140deg, var(--ac-hero-a), var(--ac-hero-b)); }
.rail, .lyr { background: linear-gradient(180deg, var(--ac-panel-a), var(--ac-panel-b)); }
.hero-inner { display: flex; gap: 32px; padding: 32px; align-items: center; }
.art { width: 240px; height: 240px; flex: 0 0 auto; object-fit: cover; border-radius: 18px; background: linear-gradient(135deg, var(--ac), var(--ac-hero-b)); box-shadow: 0 16px 36px rgba(0,0,0,.45); }
.meta { flex: 1; min-width: 0; display: grid; gap: 6px; justify-items: start; }
.meta p { margin: 0; max-width: 100%; }
.status-row { display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #6b6b72; }
.dot.live { background: #34d399; box-shadow: 0 0 8px #34d399; }
.status { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--h-fg3); }
.title { font-family: var(--disp); font-weight: 700; font-size: 38px; line-height: 1.1; letter-spacing: -.02em; color: var(--h-fg); overflow-wrap: anywhere; }
.artist { color: var(--h-fg2); font-size: 16px; }
.chip { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--h-fg2); background: rgba(255,255,255,.10); border-radius: 20px; padding: 4px 11px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.progress { width: 100%; margin-top: 18px; display: grid; gap: 8px; }
.bar { height: 5px; border-radius: 4px; background: var(--h-track); overflow: hidden; }
.fill { height: 100%; background: var(--ac); border-radius: 4px; }
.times { display: flex; justify-content: space-between; font-size: 12px; color: var(--h-fg4); font-variant-numeric: tabular-nums; }
.idle-copy { font-family: var(--disp); font-size: 24px; line-height: 1.25; color: var(--h-fg); }
.snap { font-size: 13px; color: var(--h-fg3); }
.snap.err { color: #fcd34d; }
.tune { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 18px; margin-top: 16px; }
.go { display: inline-flex; align-items: center; gap: 8px; font: inherit; font-weight: 600; font-size: 15px; padding: 11px 18px; border: 0; border-radius: 12px; cursor: pointer; background: var(--ac); color: var(--ac-ink); }
.go:hover { filter: brightness(1.08); }
.go.stop { background: rgba(255,255,255,.12); color: var(--h-fg); border: 1px solid rgba(255,255,255,.2); }
.go:disabled { opacity: .5; cursor: not-allowed; }
.go:disabled:hover { filter: none; }
.vol { display: flex; align-items: center; gap: 10px; color: var(--h-fg2); }
.vol input { width: 120px; accent-color: var(--ac); }
.spot { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 600; color: var(--h-fg); padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.2); text-decoration: none; }
.spot:hover { background: rgba(255,255,255,.12); color: var(--h-fg); }

.rail { position: sticky; top: 24px; display: flex; flex-direction: column; max-height: calc(100vh - 48px); }
.qhead { display: flex; align-items: center; gap: 9px; padding: 18px 20px 10px; }
.qlabel { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--h-fg3); }
.qcount { font-size: 11px; font-weight: 700; color: var(--ac-ink); background: var(--ac); border-radius: 20px; padding: 2px 9px; }
.queue { margin: 0; padding: 0 10px 12px; list-style: none; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
.queue li { display: flex; align-items: center; gap: 12px; padding: 7px 10px; min-width: 0; }
.qart { width: 38px; height: 38px; border-radius: 8px; flex: 0 0 auto; object-fit: cover; background: linear-gradient(135deg, var(--ac), var(--ac-hero-b)); }
.qmeta { flex: 1; min-width: 0; display: grid; }
.qt { font-size: 13.5px; font-weight: 600; color: var(--h-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa { font-size: 12px; color: var(--h-fg3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qd { font-size: 11.5px; color: var(--h-fg4); font-variant-numeric: tabular-nums; }
.qempty { margin: 0; padding: 4px 20px 18px; font-size: 13px; color: var(--h-fg4); }

.toggle { all: unset; box-sizing: border-box; width: 100%; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-family: var(--disp); font-weight: 700; font-size: 16px; color: var(--h-fg); }
.caret { transition: transform .15s; }
.caret.open { transform: rotate(180deg); }
.lyrics { max-height: 320px; overflow-y: auto; display: grid; gap: 8px; text-align: center; padding: 0 22px 20px; }
.line { margin: 0; font-size: 16px; color: var(--h-fg3); }
.line.cur { color: var(--h-fg); font-weight: 700; }

@media (max-width: 900px) {
  .deck { grid-template-columns: minmax(0, 1fr); }
  .rail { position: static; max-height: 420px; }
  .hero-inner { flex-direction: column; text-align: center; padding: 24px; }
  .meta { justify-items: center; }
  .art { width: min(240px, 100%); height: auto; aspect-ratio: 1; }
  .title { font-size: 30px; }
  .tune { justify-content: center; }
}
@media (prefers-reduced-motion: reduce) { .caret { transition: none; } }
</style>
