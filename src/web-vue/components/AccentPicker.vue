<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { hexToHsl, hslToHex } from "../lib/color";

const TEAL = "#2dd4bf";
// Laid out two per row: teal leads, then a spread around the wheel.
const PRESETS = [
  { name: "Encore teal", hex: TEAL },
  { name: "Sky", hex: "#38bdf8" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#a855f7" },
  { name: "Magenta", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#fb923c" },
  { name: "Gold", hex: "#eab308" },
  { name: "Green", hex: "#22c55e" },
  { name: "Blue", hex: "#3b82f6" },
];

const model = defineModel<string>({ required: true });
const value = computed(() => (/^#[0-9a-f]{6}$/i.test(model.value) ? model.value.toLowerCase() : TEAL));
// Local HSL so dragging stays stable through hex rounding (e.g. hue at 0% saturation).
const local = ref<[number, number, number]>(hexToHsl(value.value));
watch(value, (v) => { if (hslToHex(...local.value) !== v) local.value = hexToHsl(v); });
const hsl = computed(() => local.value);

const hexText = ref(value.value.toUpperCase());
watch(value, (v) => { hexText.value = v.toUpperCase(); });

function setHsl(h: number, s: number, l: number) { local.value = [h, s, l]; model.value = hslToHex(h, s, l); }
function onHex(e: Event) {
  const v = (e.target as HTMLInputElement).value.trim();
  hexText.value = v;
  const m = /^#?([0-9a-f]{6})$/i.exec(v);
  if (m) model.value = `#${m[1].toLowerCase()}`;
}
const num = (e: Event) => Number((e.target as HTMLInputElement).value);

const hueTrack = "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)";
const satTrack = computed(() => `linear-gradient(90deg,${hslToHex(hsl.value[0], 0, hsl.value[2])},${hslToHex(hsl.value[0], 100, hsl.value[2])})`);
const litTrack = computed(() => `linear-gradient(90deg,#000,${hslToHex(hsl.value[0], hsl.value[1], 50)},#fff)`);
</script>

<template>
  <div class="accent">
    <div class="presets" role="radiogroup" aria-label="Accent presets">
      <button
        v-for="p in PRESETS" :key="p.hex" type="button" role="radio"
        class="swatch" :class="{ active: value === p.hex }" :aria-checked="value === p.hex"
        :aria-label="p.name" :title="p.name" :style="{ background: p.hex }"
        @click="model = p.hex"
      ></button>
    </div>
    <div class="controls">
      <div class="pick">
        <input class="native" type="color" :value="value" aria-label="Pick colour" @input="model = ($event.target as HTMLInputElement).value" />
        <input class="field hex" :value="hexText" maxlength="7" spellcheck="false" aria-label="Hex colour" @input="onHex" />
      </div>
      <label class="slider"><span class="slbl">Hue</span>
        <input type="range" min="0" max="360" :value="Math.round(hsl[0])" :style="{ background: hueTrack }" @input="setHsl(num($event), hsl[1], hsl[2])" /></label>
      <label class="slider"><span class="slbl">Saturation</span>
        <input type="range" min="0" max="100" :value="Math.round(hsl[1])" :style="{ background: satTrack }" @input="setHsl(hsl[0], num($event), hsl[2])" /></label>
      <label class="slider"><span class="slbl">Lightness</span>
        <input type="range" min="0" max="100" :value="Math.round(hsl[2])" :style="{ background: litTrack }" @input="setHsl(hsl[0], hsl[1], num($event))" /></label>
    </div>
  </div>
</template>

<style scoped>
.accent { display: flex; gap: 16px; align-items: flex-start; margin-top: 20px; }
.presets { display: grid; grid-template-columns: repeat(2, 30px); gap: 9px; flex: 0 0 auto; margin-top: 4px; }
.swatch { width: 30px; height: 30px; border-radius: 8px; border: 0; padding: 0; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14); }
.swatch:hover { transform: scale(1.07); }
.swatch.active, .swatch:focus-visible { outline: 2px solid var(--txt); outline-offset: 2px; }
.controls { flex: 1; min-width: 0; display: grid; gap: 13px; }
.pick { display: flex; align-items: stretch; gap: 10px; margin-bottom: 3px; }
.native { width: 54px; height: 46px; flex: 0 0 auto; padding: 3px; border: 1px solid var(--line2); border-radius: 10px; background: var(--sub); cursor: pointer; }
.native::-webkit-color-swatch-wrapper { padding: 0; }
.native::-webkit-color-swatch { border: 0; border-radius: 7px; }
.native::-moz-color-swatch { border: 0; border-radius: 7px; }
.hex { flex: 1; min-width: 0; height: 46px; text-transform: uppercase; letter-spacing: .02em; }
.slider { display: grid; gap: 6px; }
.slbl { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }
input[type=range] { appearance: none; -webkit-appearance: none; width: 100%; height: 14px; margin: 0; border-radius: 7px; border: 1px solid var(--line2); cursor: pointer; }
input[type=range]:focus-visible { outline: 2px solid var(--ind); outline-offset: 3px; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 2px solid rgba(0,0,0,.25); box-shadow: 0 1px 3px rgba(0,0,0,.35); }
input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid rgba(0,0,0,.25); box-shadow: 0 1px 3px rgba(0,0,0,.35); }
</style>
