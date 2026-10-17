<script setup lang="ts">
import { computed } from "vue";
import { useConfig } from "../../composables/useConfig";
import SectionCard from "../../components/SectionCard.vue";
import LoadingState from "../../components/LoadingState.vue";
import ToggleSwitch from "../../components/ToggleSwitch.vue";
import TextField from "../../components/TextField.vue";
import AccentPicker from "../../components/AccentPicker.vue";
import { ref } from "vue";
import qrcode from "qrcode-generator";
import { listenUrl, isLoopbackHost } from "../../lib/listenUrl";

const { config, loaded, summary } = useConfig();
const c = config as any;

const listenerOn = computed(() => summary.listener === true);
const publicListenUrl = listenUrl(window.location.origin);
const loopback = isLoopbackHost(window.location.hostname);
const copied = ref(false);
async function copyLink() {
  try { await navigator.clipboard.writeText(publicListenUrl); } catch { return; }
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1500);
}
const qrSvg = computed(() => {
  const qr = qrcode(0, "M");
  qr.addData(publicListenUrl);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
});
</script>

<template>
  <LoadingState v-if="!loaded" />
  <SectionCard v-else title="Listener" subtitle="A public, listen-only page. Display name applies on save; enabling or disabling needs a Snapcast restart.">
    <div class="setrow first">
      <div class="setrow-txt">
        <div class="setrow-title">Enable Listener</div>
        <div class="setrow-sub">Serve a public, listen-only page at <code>/listen</code> with no login.</div>
      </div>
      <ToggleSwitch :on="c.listener" label="Enable Listener" @toggle="c.listener = !c.listener" />
    </div>
    <div class="name-field">
      <TextField label="Display name" placeholder="Encore" v-model="c.listenerDisplayName" />
      <div class="dev-hint">Shown as the title on the Listener page. Leave blank to show "Encore".</div>
    </div>
    <div class="name-field">
      <div class="flabel">Accent colour</div>
      <AccentPicker v-model="c.listenerAccent" />
      <div class="dev-hint">Recolours the whole Listener page for everyone. Applies on save.</div>
    </div>
    <div class="name-field">
      <div class="flabel">Listener link</div>
      <div class="linkrow">
        <input class="field mono" :value="publicListenUrl" readonly aria-label="Listener link" @focus="($event.target as HTMLInputElement).select()" />
        <button type="button" class="btn" @click="copyLink">{{ copied ? "Copied" : "Copy" }}</button>
      </div>
    </div>
    <div v-if="listenerOn" class="listen-share">
      <div class="qr" role="img" aria-label="QR code for the public listen page" v-html="qrSvg"></div>
      <div class="listen-txt">
        <div class="flabel">Public listen link</div>
        <a :href="publicListenUrl" target="_blank" rel="noopener" class="listen-url mono">{{ publicListenUrl }}</a>
        <div class="dev-hint">Guests can scan the code to listen.</div>
        <div v-if="loopback" class="dev-hint">This address is only reachable from this machine. Open Settings via the server's network address to share a working link.</div>
      </div>
    </div>
  </SectionCard>
</template>

<style scoped>
.setrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.setrow-txt { min-width: 0; }
.setrow-title { font-size: 14px; font-weight: 600; }
.setrow-sub { font-size: 12.5px; color: var(--dim); margin-top: 2px; }
.setrow code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--sub); padding: 1px 4px; border-radius: 4px; }
.name-field { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--line); }
.linkrow { display: flex; gap: 8px; }
.linkrow .field { flex: 1; }
.listen-share { display: flex; align-items: center; gap: 16px; margin-top: 20px; }
.qr { width: 120px; height: 120px; flex: none; background: #fff; border-radius: 8px; overflow: hidden; }
.qr :deep(svg) { width: 100%; height: 100%; display: block; }
.listen-txt { min-width: 0; }
.listen-url { font-size: 13px; overflow-wrap: anywhere; }
.dev-hint { font-size: 11.5px; color: var(--faint); margin-top: 4px; }
</style>
