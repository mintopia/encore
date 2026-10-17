<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { readTrack, readPlayback, readQueue, applyAnchor, nowMs, fmtTime, type Track } from "../lib/wire";
import { SnapClient, type SnapState } from "../lib/snapclient";
import { PhSun, PhMoon, PhHeadphones, PhStop, PhSpeakerSimpleHigh, PhSpotifyLogo, PhVinylRecord, PhCaretDown, PhMusicNotesSimple, PhMusicNotes, PhArrowUpRight, PhMicrophoneStage } from "@phosphor-icons/vue";
import SiteFooter from "../components/SiteFooter.vue";
import Marquee from "../components/Marquee.vue";
import { hexToHsl, luminance } from "../lib/color";
import { useTheme } from "../composables/useTheme";
import { currentIndex, fetchSyncedLyrics, type LyricLine } from "../lib/overlay-engine";

const boot = (window as unknown as { __SOLOIST_LISTEN__?: { token?: string; displayName?: string; accent?: string } }).__SOLOIST_LISTEN__;

const track = ref<Track | null>(null);
const queue = ref<Track[]>([]);
const lyricsOpen = ref(true);
const lyrics = ref<LyricLine[]>([]);
const lyricsEl = ref<HTMLElement>();
const { theme, toggle: toggleTheme } = useTheme();
const wsUp = ref(false);
const everUp = ref(false);
const anchor = reactive({ anchorMs: 0, anchorAt: 0, speed: 0 });
const positionMs = ref(0);

const durationMs = computed(() => track.value?.durationMs ?? 0);
const pct = computed(() => (durationMs.value > 0 ? Math.min(100, (positionMs.value / durationMs.value) * 100) : 0));

const ACCENT = /^#[0-9a-f]{6}$/i.test(boot?.accent ?? "") ? boot!.accent! : "#2dd4bf";
const spotifyId = computed(() => /^spotify:track:([A-Za-z0-9]+)$/.exec(track.value?.uri ?? "")?.[1] ?? "");
const spotifyUrl = computed(() => (spotifyId.value ? `https://open.spotify.com/track/${spotifyId.value}` : ""));

// The scene is a dark, accent-tinted world so white text stays legible at any hue.
const sceneVars = computed(() => {
  const [h, s] = hexToHsl(ACCENT);
  const sat = Math.min(Math.max(s, 28), 66);
  const glow = Math.min(s, 85);
  const hue = (shift: number) => (h + shift + 360) % 360;
  return {
    "--ac": ACCENT,
    "--ac-ink": luminance(ACCENT) > 0.21 ? "#06231f" : "#fff",
    "--hero-a": `hsl(${h} ${sat}% 9%)`,
    "--hero-b": `hsl(${hue(20)} ${sat}% 13%)`,
    "--hero-c": `hsl(${hue(-20)} ${sat}% 11%)`,
    "--panel-a": `hsl(${h} ${sat}% 9%)`,
    "--panel-b": `hsl(${hue(16)} ${sat}% 12%)`,
    // Blooms are always the accent hue itself, so no teal leaks in under another accent.
    "--bloom-a": `hsl(${h} ${glow}% 56% / .34)`,
    "--bloom-b": `hsl(${h} ${glow}% 48% / .24)`,
    "--page-light": `hsl(${h} ${Math.min(s, 45)}% 94%)`,
    "--page-dark": `hsl(${h} ${Math.min(s, 40)}% 6%)`,
    "--card-dark": `hsl(${h} ${Math.min(s, 40)}% 11%)`,
    "--line-dark": `hsl(${h} ${Math.min(s, 34)}% 20%)`,
    "--dim-dark": `hsl(${h} ${Math.min(s, 22)}% 74%)`,
    "--faint-dark": `hsl(${h} ${Math.min(s, 16)}% 62%)`,
    "--page-a": `hsl(${h} 70% 46% / .22)`,
    "--page-b": `hsl(${h} 72% 52% / .16)`,
    "--page-c": `hsl(${h} 70% 42% / .14)`,
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

// Scroll only the lyrics box; scrollIntoView would also drag the page to the panel.
function centreLyric(behavior: ScrollBehavior) {
  if (!lyricsOpen.value) return;
  nextTick(() => {
    const box = lyricsEl.value;
    const cur = box?.querySelector<HTMLElement>(".cur");
    if (!box || !cur) return;
    box.scrollTo({ top: cur.offsetTop - box.clientHeight / 2 + cur.clientHeight / 2, behavior });
  });
}
watch(lyricIdx, () => centreLyric("smooth"));
watch([lyrics, lyricsOpen], () => centreLyric("instant"));

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
  ws.onopen = () => { backoffMs = 1000; wsUp.value = true; everUp.value = true; };
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
const statusText = computed(() => (anchor.speed > 0 ? "Now playing" : "Paused"));
const idle = computed(() => !track.value);
const liveLabel = computed(() => (wsUp.value ? "Live" : everUp.value ? "Reconnecting…" : "Connecting…"));
// Screen-reader only: the visible UI carries no stream description.
const snapLabel = computed(() => {
  if (!wantStream.value) return "";
  if (snapState.value === "error") return "Stream reconnecting…";
  if (snapState.value === "connecting") return "Connecting to stream…";
  if (snapState.value === "playing") return "Streaming to this device";
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
    <main class="listen">
      <header class="top">
        <div class="brand">
          <span class="tile" aria-hidden="true"><PhMusicNotesSimple :size="20" weight="bold" /></span>
          <h1 class="wordmark">{{ boot?.displayName || "Encore" }}</h1>
        </div>
        <div class="top-right">
          <span class="live" :class="{ down: !wsUp }" role="status"><span class="live-dot"></span>{{ liveLabel }}</span>
          <button type="button" class="theme" :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
            <PhSun v-if="theme === 'dark'" :size="18" weight="bold" />
            <PhMoon v-else :size="18" weight="bold" />
          </button>
        </div>
      </header>

      <div class="deck">
        <section class="hero" aria-label="Now playing">
          <div class="bloom bloom-a" aria-hidden="true"></div>
          <div class="bloom bloom-b" aria-hidden="true"></div>
          <div class="hero-inner">
            <template v-if="track">
              <div class="art-row">
                <img v-if="track.art" class="art" :src="track.art" alt="" />
                <div v-else class="art" aria-hidden="true"></div>
                <div class="meta">
                  <div class="status-row">
                    <span class="dot" :class="{ on: anchor.speed > 0 }"></span>
                    <span class="status">{{ statusText }}</span>
                  </div>
                  <p class="title" :title="track.title"><Marquee :text="track.title" /></p>
                  <p v-if="track.artist" class="artist" :title="track.artist">{{ track.artist }}</p>
                  <div v-if="track.album || spotifyUrl" class="actions">
                    <span v-if="track.album" class="chip" :title="track.album"><PhVinylRecord :size="15" weight="fill" /><span>{{ track.album }}</span></span>
                    <a v-if="spotifyUrl" class="spot" :href="spotifyUrl" target="_blank" rel="noopener">
                      <PhSpotifyLogo class="spot-logo" :size="15" weight="fill" />Open in Spotify<PhArrowUpRight class="spot-arrow" :size="12" weight="bold" />
                    </a>
                  </div>
                </div>
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

            <div v-else class="idle">
              <div class="idle-art" aria-hidden="true"><PhMusicNotes :size="48" weight="fill" /></div>
              <p class="idle-title">Nothing playing</p>
              <p class="idle-sub">When someone starts to play music, you'll hear it here.</p>
            </div>

            <div v-if="!idle || snapActive" class="tune" :class="{ bare: idle }">
              <button type="button" class="go" :class="{ stop: snapActive }" @click="toggleSnap">
                <PhStop v-if="snapActive" :size="19" weight="fill" />
                <PhHeadphones v-else :size="19" weight="fill" />
                {{ snapActive ? "Stop" : "Stream here" }}
              </button>
              <template v-if="snapActive">
                <span class="spacer"></span>
                <label class="vol">
                  <PhSpeakerSimpleHigh :size="19" weight="fill" aria-hidden="true" />
                  <input type="range" min="0" max="100" step="1" :value="volume" :style="{ '--v': volume + '%' }" aria-label="Your volume" @input="onVolume" />
                </label>
              </template>
              <span class="sr-only" role="status">{{ snapLabel }}</span>
            </div>
          </div>
        </section>

        <aside class="rail" aria-label="Queue">
          <div class="qhead">
            <h2 class="qlabel">Queue</h2>
            <span class="qcount">{{ queue.length }}</span>
          </div>
          <ol v-if="queue.length" class="queue">
            <li v-for="(q, i) in queue" :key="i" :title="[q.title, q.artist].filter(Boolean).join(' — ')">
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
          <span class="toggle-label"><PhMicrophoneStage :size="17" weight="fill" aria-hidden="true" />Lyrics</span>
          <PhCaretDown :size="18" weight="bold" class="caret" :class="{ open: lyricsOpen }" aria-hidden="true" />
        </button>
        <div v-if="lyricsOpen" ref="lyricsEl" class="lyrics">
          <p v-for="(l, i) in lyrics" :key="i" class="line" :class="{ cur: i === lyricIdx, past: lyricIdx >= 0 && i < lyricIdx }">{{ l.text || "♪" }}</p>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.scene {
  --h-fg: #fff; --h-fg2: rgba(255,255,255,.72); --h-fg3: rgba(255,255,255,.6); --h-fg4: rgba(255,255,255,.55);
  --h-track: rgba(255,255,255,.16); --h-hair: rgba(255,255,255,.10); --h-green: #34d399;
  position: relative; min-height: 100dvh; display: flex; flex-direction: column; overflow-x: clip;
  /* Opaque accent-tinted ground: replaces the global paper/slate and its teal blooms. */
  background-color: var(--page-light);
  background-image:
    radial-gradient(920px 540px at 4% -10%, var(--page-a), transparent 62%),
    radial-gradient(820px 560px at 100% 0%, var(--page-b), transparent 60%),
    radial-gradient(780px 640px at 52% 116%, var(--page-c), transparent 62%);
  background-attachment: fixed;
}
:root[data-theme="dark"] .scene {
  background-color: var(--page-dark);
  --card: var(--card-dark); --line: var(--line-dark); --dim: var(--dim-dark); --faint: var(--faint-dark);
}
.listen { position: relative; flex: 1; width: min(1180px, 100%); margin: 0 auto; padding: 28px 26px 10px; display: grid; align-content: start; }

.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
.brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
.tile {
  display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 10px; color: var(--ac-ink);
  background: linear-gradient(135deg, color-mix(in srgb, var(--ac), #fff 10%), var(--ac));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--ac), transparent 60%);
}
.wordmark { margin: 0; font-family: var(--disp); font-weight: 700; font-size: 24px; letter-spacing: -0.01em; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.live { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: var(--dim); background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 5px 12px; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 8px var(--ac); }
.live.down { color: var(--warn); }
.live.down .live-dot { background: var(--warn); box-shadow: 0 0 8px var(--warn); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.theme { display: grid; place-items: center; padding: 0; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; background: var(--card); color: var(--txt); border: 1px solid var(--line); }
.theme:focus-visible, .go:focus-visible, .spot:focus-visible, .toggle:focus-visible, .vol input:focus-visible { outline: 2px solid var(--ac); outline-offset: 3px; }

.deck { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(332px, 1fr); gap: 20px; align-items: start; }
.hero, .rail, .lyr { position: relative; border-radius: 20px; overflow: hidden; border: 1px solid var(--h-hair); color: var(--h-fg); }
.hero { background: linear-gradient(135deg, var(--hero-a) 0%, var(--hero-b) 55%, var(--hero-c) 100%); box-shadow: 0 22px 54px rgba(4, 14, 26, .46); }
.rail, .lyr { background: linear-gradient(180deg, var(--panel-a), var(--panel-b)); box-shadow: 0 22px 54px rgba(4, 14, 26, .4); }
.bloom { position: absolute; width: 460px; height: 460px; border-radius: 50%; pointer-events: none; }
.bloom-a { left: -140px; top: -220px; background: radial-gradient(circle, var(--bloom-a), transparent 64%); }
.bloom-b { right: -160px; bottom: -240px; background: radial-gradient(circle, var(--bloom-b), transparent 64%); }
.hero-inner { position: relative; padding: 30px 32px; }

.art-row { display: flex; gap: 28px; align-items: center; }
.art { width: 240px; height: 240px; flex: 0 0 auto; object-fit: cover; border-radius: 18px; background: rgba(255,255,255,.05); box-shadow: 0 20px 44px rgba(0,0,0,.5); }
.meta { flex: 1; min-width: 0; }
.status-row { display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #6b6b72; }
.dot.on { background: var(--ac); box-shadow: 0 0 8px var(--ac); }
.status { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--h-fg3); }
.title { margin: 10px 0 0; font-family: var(--disp); font-weight: 700; font-size: 38px; line-height: 1.15; letter-spacing: -.025em; color: var(--h-fg); }
.artist {
  margin: 6px 0 0; color: var(--h-fg2); font-size: 16px; line-height: 1.35; overflow: hidden;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2;
}
.actions { display: flex; flex-direction: column; align-items: flex-start; gap: 9px; margin-top: 16px; min-width: 0; }
.chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; min-width: 0; overflow: hidden; font-size: 12px; font-weight: 600; color: var(--h-fg2); background: rgba(255,255,255,.1); border-radius: 20px; padding: 5px 11px; }
.chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spot { flex: none; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--h-fg); background: rgba(255,255,255,.1); border: 1px solid var(--h-hair); border-radius: 20px; padding: 5px 12px; text-decoration: none; }
.spot:hover { background: rgba(255,255,255,.18); color: var(--h-fg); }
.spot-logo { color: #1ed760; }
.spot-arrow { opacity: .7; }

.progress { margin-top: 26px; }
.bar { height: 5px; border-radius: 4px; background: var(--h-track); overflow: hidden; }
.fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, color-mix(in srgb, var(--ac), #000 20%), var(--ac)); }
.times { display: flex; justify-content: space-between; margin-top: 9px; font-size: 12px; color: var(--h-fg4); font-variant-numeric: tabular-nums; }

.tune { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 18px; margin-top: 24px; padding-top: 22px; border-top: 1px solid var(--h-hair); }
.tune.bare { justify-content: center; }
.go {
  display: inline-flex; align-items: center; gap: 10px; font: inherit; font-weight: 700; font-size: 15px; padding: 14px 22px; border: 0; border-radius: 14px; cursor: pointer;
  color: var(--ac-ink); background: linear-gradient(135deg, var(--ac), color-mix(in srgb, var(--ac), #fff 16%));
  box-shadow: 0 10px 26px color-mix(in srgb, var(--ac), transparent 60%);
}
.go:hover { filter: brightness(1.05); }
.go.stop { background: rgba(255,255,255,.12); color: var(--h-fg); box-shadow: none; border: 1px solid var(--h-hair); }
.spacer { flex: 1; }
.vol { display: flex; align-items: center; gap: 11px; color: var(--h-fg2); }
.vol input {
  appearance: none; -webkit-appearance: none; width: 140px; height: 6px; border-radius: 4px; cursor: pointer; margin: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--ac), #000 16%), var(--ac)) 0 / var(--v) 100% no-repeat, var(--h-track);
}
.vol input::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
.vol input::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }

.idle { display: grid; place-items: center; gap: 14px; padding: 34px 0 18px; text-align: center; }
.idle-art { display: grid; place-items: center; width: 150px; height: 150px; border-radius: 18px; color: rgba(255,255,255,.5); background: rgba(255,255,255,.05); border: 1px solid var(--h-hair); }
.idle-title { margin: 0; font-family: var(--disp); font-weight: 700; font-size: 17px; color: var(--h-fg); }
.idle-sub { margin: -6px 0 0; max-width: 320px; text-wrap: balance; font-size: 13.5px; color: var(--h-fg4); }

.rail { position: sticky; top: 18px; display: flex; flex-direction: column; max-height: calc(100vh - 36px); }
.qhead { display: flex; align-items: center; gap: 10px; padding: 18px 20px 12px; }
.qlabel { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--h-fg3); }
.qcount { font-size: 11px; font-weight: 700; color: var(--ac-ink); background: var(--ac); border-radius: 20px; padding: 2px 9px; }
.queue { margin: 0; padding: 0 10px 14px; list-style: none; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
.queue li { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 10px; min-width: 0; }
.queue li:hover { background: rgba(255,255,255,.05); }
.qart { width: 42px; height: 42px; border-radius: 9px; flex: 0 0 auto; object-fit: cover; background: rgba(255,255,255,.06); }
.qmeta { flex: 1; min-width: 0; display: grid; }
.qt { font-size: 13.5px; font-weight: 600; color: var(--h-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa { font-size: 12px; color: rgba(255,255,255,.62); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qd { font-size: 11.5px; color: rgba(255,255,255,.52); font-variant-numeric: tabular-nums; }
.qempty { margin: 0; padding: 4px 20px 18px; font-size: 13px; color: var(--h-fg4); }

.lyr { margin-top: 20px; }
.toggle { all: unset; box-sizing: border-box; width: 100%; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.toggle-label { display: inline-flex; align-items: center; gap: 9px; font-family: var(--disp); font-weight: 700; font-size: 15px; color: var(--h-fg); }
.caret { color: var(--h-fg3); transition: transform .2s; }
.caret.open { transform: rotate(180deg); }
.lyrics { position: relative; max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 13px; text-align: center; padding: 4px 22px 24px; }
.line { margin: 0; font-family: var(--disp); font-weight: 600; font-size: 18px; line-height: 1.25; color: var(--h-fg4); }
.line.past { color: rgba(255,255,255,.32); }
.line.cur { color: var(--h-fg); font-size: 22px; font-weight: 700; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

@media (max-width: 900px) {
  .deck { grid-template-columns: minmax(0, 1fr); }
  .rail { position: static; max-height: 420px; }
}
@media (max-width: 560px) {
  .listen { padding: 20px 16px 8px; }
  .hero-inner { padding: 22px 20px; }
  .art-row { flex-direction: column; gap: 20px; text-align: center; }
  .art { width: min(320px, 72vw); height: auto; aspect-ratio: 1; }
  .meta { align-self: stretch; }
  .status-row { justify-content: center; }
  .actions { align-items: center; }
  .title { font-size: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .caret { transition: none; }
  .live.down .live-dot { animation: none; }
}
</style>
