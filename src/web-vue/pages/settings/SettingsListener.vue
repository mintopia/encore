<script setup lang="ts">
import { computed, ref } from "vue";
import qrcode from "qrcode-generator";
import { PhCopy, PhCheck } from "@phosphor-icons/vue";
import { useConfig } from "../../composables/useConfig";
import SectionCard from "../../components/SectionCard.vue";
import LoadingState from "../../components/LoadingState.vue";
import ToggleSwitch from "../../components/ToggleSwitch.vue";
import TextField from "../../components/TextField.vue";
import AccentPicker from "../../components/AccentPicker.vue";
import { listenUrl, isLoopbackHost } from "../../lib/listenUrl";

const { config, loaded, summary } = useConfig();
const c = config as any;

const listenerOn = computed(() => summary.listener === true);
const publicListenUrl = listenUrl(window.location.origin);
const loopback = isLoopbackHost(window.location.hostname);
const copied = ref(false);
const linkInput = ref<HTMLInputElement>();
async function copyLink() {
  try { await navigator.clipboard.writeText(publicListenUrl); } catch { linkInput.value?.select(); return; }
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
  <SectionCard v-else title="Listener" subtitle="The public listen-along page anyone on your network can open at /listen.">
    <div class="frow">
      <div class="ftext">
        <div class="ftitle">Public listener page</div>
        <div class="fhelp">Serve <code>/listen</code> so people on your network can tune in and sing along. No sign-in needed. Turning it on or off needs a Snapcast restart.</div>
      </div>
      <ToggleSwitch :on="c.listener" label="Public listener page" @toggle="c.listener = !c.listener" />
    </div>

    <div class="block">
      <TextField label="Display name" placeholder="Encore" v-model="c.listenerDisplayName" />
      <div class="hint">Shown as the title on the listener page. Leave blank to show “Encore”.</div>
    </div>

    <div class="block">
      <div class="flabel">Accent colour</div>
      <AccentPicker v-model="c.listenerAccent" />
      <div class="hint">Recolours the listener page for everyone. Text contrast adjusts automatically.</div>
    </div>

    <div class="block">
      <div class="flabel">Listener link</div>
      <div class="linkrow">
        <input ref="linkInput" class="field ro" :value="publicListenUrl" readonly aria-label="Listener link" @focus="($event.target as HTMLInputElement).select()" />
        <button type="button" class="btn" @click="copyLink">
          <PhCheck v-if="copied" :size="15" weight="fill" /><PhCopy v-else :size="15" weight="fill" />{{ copied ? "Copied" : "Copy" }}
        </button>
      </div>
      <div class="hint">Share this link, or show the QR on the screen.</div>
      <div v-if="listenerOn" class="qr" role="img" aria-label="QR code for the listener link" v-html="qrSvg"></div>
      <div v-if="loopback" class="hint warn">This address only works on this machine. Open Settings via the server's network address to share a working link.</div>
    </div>
  </SectionCard>
</template>

<style scoped>
.frow { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; }
.ftext { max-width: 60ch; }
.ftitle { font-size: 14px; font-weight: 600; }
.fhelp { font-size: 12.5px; color: var(--dim); margin-top: 3px; }
.block { padding: 16px 0 4px; border-top: 1px solid var(--line); }
.block + .block { margin-top: 12px; }
.hint { font-size: 12px; color: var(--faint); margin-top: 6px; }
.hint.warn { color: var(--warn); }
.linkrow { display: flex; gap: 8px; align-items: center; }
.linkrow .field { flex: 1; min-width: 0; }
.qr { width: 120px; height: 120px; margin-top: 12px; background: #fff; border-radius: 10px; overflow: hidden; }
.qr :deep(svg) { width: 100%; height: 100%; display: block; }
</style>
