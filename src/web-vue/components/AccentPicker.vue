<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { hexToHsl, hslToHex } from "../lib/color";

const TEAL = "#14b8a6";
const PRESETS = [
  { name: "Encore teal", hex: TEAL },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Magenta", hex: "#d946ef" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Gold", hex: "#eab308" },
  { name: "Green", hex: "#22c55e" },
];

const model = defineModel<string>({ required: true });
const value = computed(() => (/^#[0-9a-f]{6}$/i.test(model.value) ? model.value.toLowerCase() : TEAL));
const hsl = computed(() => hexToHsl(value.value));
const hueVal = computed(() => Math.round(hsl.value[0]));
const satVal = computed(() => Math.round(hsl.value[1]));
const litVal = computed(() => Math.round(hsl.value[2]));

const hexText = ref(value.value);
watch(value, (v) => { hexText.value = v; });

function setHsl(h: number, s: number, l: number) { model.value = hslToHex(h, s, l); }
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
      <label class="row"><span class="lbl">Hue</span>
        <input type="range" min="0" max="360" :value="hueVal" :style="{ '--track': hueTrack }" aria-label="Hue" @input="setHsl(num($event), hsl[1], hsl[2])" /></label>
      <label class="row"><span class="lbl">Saturation</span>
        <input type="range" min="0" max="100" :value="satVal" :style="{ '--track': satTrack }" aria-label="Saturation" @input="setHsl(hsl[0], num($event), hsl[2])" /></label>
      <label class="row"><span class="lbl">Lightness</span>
        <input type="range" min="0" max="100" :value="litVal" :style="{ '--track': litTrack }" aria-label="Lightness" @input="setHsl(hsl[0], hsl[1], num($event))" /></label>
      <div class="row">
        <span class="lbl">Hex</span>
        <input class="field hex mono" :value="hexText" maxlength="7" spellcheck="false" aria-label="Hex colour" @input="onHex" />
        <input class="native" type="color" :value="value" aria-label="Pick colour" @input="model = ($event.target as HTMLInputElement).value" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.accent { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
.presets { display: grid; grid-template-columns: repeat(5, 28px); gap: 8px; }
.swatch { width: 28px; height: 28px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; padding: 0; }
.swatch.active { border-color: var(--ink); box-shadow: 0 0 0 2px var(--bg, #fff) inset; }
.swatch:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.controls { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 220px; }
.row { display: flex; align-items: center; gap: 10px; }
.lbl { width: 76px; font-size: 12.5px; color: var(--dim); flex: none; }
input[type=range] { flex: 1; appearance: none; height: 10px; border-radius: 6px; background: var(--track); outline-offset: 3px; }
input[type=range]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid #333; cursor: pointer; }
input[type=range]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 2px solid #333; cursor: pointer; }
.hex { width: 100px; }
.native { width: 36px; height: 30px; padding: 0; border: 1px solid var(--line); border-radius: 6px; background: none; cursor: pointer; }
</style>
