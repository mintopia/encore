<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { useConfig } from "../../composables/useConfig";
import SectionCard from "../../components/SectionCard.vue";
import LoadingState from "../../components/LoadingState.vue";
import ToggleSwitch from "../../components/ToggleSwitch.vue";
import TextField from "../../components/TextField.vue";
import qrcode from "qrcode-generator";
import { listenUrl, isLoopbackHost } from "../../lib/listenUrl";
import type { ExternalSnapcastStatus } from "../../../wire-contract";

const { config, loaded, summary } = useConfig();
const c = config as any;

// Placeholder tokens shown in the Snapcast config hint. Kept as string constants because a
// literal "{{…}}" in the template would be parsed as a Vue interpolation.
const streamPh = "{{stream}}";
const snapwebPh = "{{snapweb}}";
const configId = useId();
const modeId = useId();
const portId = useId();

const ext = ref<ExternalSnapcastStatus>({ mode: "off", capturing: false, connected: false, clients: 0, lastError: null });
let timer: number | undefined;

async function refreshExt() {
  try {
    const r = await fetch("/api/snapcast-external", { credentials: "same-origin" });
    if (r.ok) ext.value = await r.json();
  } catch { /* keep last known status */ }
}

onMounted(() => { refreshExt(); timer = window.setInterval(refreshExt, 3000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });

const extPill = computed(() => {
  const s = ext.value;
  if (s.mode === "off") return { cls: "disabled", text: "Off" };
  if (s.mode === "push") return s.connected ? { cls: "connected", text: "Connected" } : { cls: "reconnecting", text: "Connecting…" };
  return s.clients > 0
    ? { cls: "connected", text: s.clients === 1 ? "1 server reading" : `${s.clients} servers reading` }
    : { cls: "reconnecting", text: "Waiting for server" };
});

const portText = computed({
  get: () => String(c.audio.externalSnapcast.port ?? ""),
  set: (v: string) => { c.audio.externalSnapcast.port = Number.parseInt(v, 10) || 0; },
});

const listenerOn = computed(() => summary.listener === true);
const publicListenUrl = listenUrl(window.location.origin);
const loopback = isLoopbackHost(window.location.hostname);
const qrSvg = computed(() => {
  const qr = qrcode(0, "M");
  qr.addData(publicListenUrl);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
});

// The source line the operator adds to the external server's snapserver.conf.
const sourceLine = computed(() => {
  const e = c.audio.externalSnapcast;
  const name = c.streamName || "Spotify";
  return e.mode === "pull"
    ? `source = tcp://${window.location.hostname}:${e.port}?name=${name}&mode=client&sampleformat=48000:16:2`
    : `source = tcp://0.0.0.0:${e.port}?name=${name}&sampleformat=48000:16:2`;
});
</script>

<template>
  <LoadingState v-if="!loaded" />
  <template v-else>
  <SectionCard title="Snapcast" subtitle="Multi-room audio server (Docker). Changes apply after a Snapcast restart.">
    <div class="setrow first">
      <div class="setrow-txt">
        <div class="setrow-title">Enable Snapweb</div>
        <div class="setrow-sub">Serve the Snapcast web UI and link it from the menu.</div>
      </div>
      <ToggleSwitch :on="c.snapweb" label="Enable Snapweb" @toggle="c.snapweb = !c.snapweb" />
    </div>
    <div class="setrow">
      <div class="setrow-txt">
        <div class="setrow-title">Enable Listener</div>
        <div class="setrow-sub">Serve a public, listen-only page at <code>/listen</code> with no login.</div>
      </div>
      <ToggleSwitch :on="c.listener" label="Enable Listener" @toggle="c.listener = !c.listener" />
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
    <div class="tf snap-conf">
      <label class="flabel" :for="configId">Snapcast server config</label>
      <textarea :id="configId" class="field mono" rows="12" spellcheck="false" v-model="c.snapcastServerConfig"></textarea>
      <div class="dev-hint">
        <code>{{ streamPh }}</code> expands to the capture source line,
        <code>{{ snapwebPh }}</code> to the Snapweb enable flag (true/false).
      </div>
    </div>
  </SectionCard>
  <SectionCard
    title="External Snapcast server"
    subtitle="Also send Soloist's audio to another Snapserver, alongside the bundled one. Applies on save."
  >
    <div class="ext-head">
      <div class="ext-pill">
        <span class="pill" :class="extPill.cls"><span class="dot"></span>{{ extPill.text }}</span>
        <div v-if="ext.mode !== 'off' && ext.lastError" class="ext-err" :title="ext.lastError">{{ ext.lastError }}</div>
      </div>
    </div>
    <div class="grid2">
      <div class="tf">
        <label class="flabel" :for="modeId">Mode</label>
        <select :id="modeId" class="field" v-model="c.audio.externalSnapcast.mode">
          <option value="off">Off</option>
          <option value="push">Push: we connect to the server</option>
          <option value="pull">Pull: the server connects to us</option>
        </select>
      </div>
      <div></div>
      <TextField v-if="c.audio.externalSnapcast.mode === 'push'" label="Server host" placeholder="snapcast.example.lan" v-model="c.audio.externalSnapcast.host" />
      <div v-if="c.audio.externalSnapcast.mode !== 'off'" class="tf">
        <label class="flabel" :for="portId">{{ c.audio.externalSnapcast.mode === 'push' ? 'Server port' : 'Listen port' }}</label>
        <input :id="portId" class="field" type="number" min="1" max="65535" v-model="portText" />
      </div>
    </div>
    <div v-if="c.audio.externalSnapcast.mode !== 'off'" class="snap-conf">
      <div class="flabel">Add to the external server's snapserver.conf</div>
      <pre class="src-line mono">[stream]
{{ sourceLine }}</pre>
      <div class="dev-hint">Raw PCM, 48000 Hz, 16-bit, stereo.</div>
    </div>
  </SectionCard>
  </template>
</template>

<style scoped>
.setrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--line); }
.setrow.first { margin-top: 0; padding-top: 0; border-top: none; }
.setrow-txt { min-width: 0; }
.setrow-title { font-size: 14px; font-weight: 600; }
.setrow-sub { font-size: 12.5px; color: var(--dim); margin-top: 2px; }
.snap-conf { margin-top: 20px; }
.listen-share { display: flex; align-items: center; gap: 16px; margin-top: 20px; }
.qr { width: 120px; height: 120px; flex: none; background: #fff; border-radius: 8px; overflow: hidden; }
.qr :deep(svg) { width: 100%; height: 100%; display: block; }
.listen-txt { min-width: 0; }
.listen-url { font-size: 13px; overflow-wrap: anywhere; }
.snap-conf .field { width: 100%; box-sizing: border-box; }
.tf .field { width: 100%; }
textarea.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; line-height: 1.5; resize: vertical; }
.snap-conf code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--sub); padding: 1px 4px; border-radius: 4px; }
.ext-head { display: flex; justify-content: flex-end; margin-bottom: 14px; }
.ext-pill { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.ext-err { font-size: 11.5px; color: var(--faint); max-width: 340px; text-align: right; overflow-wrap: break-word; word-break: break-word; }
.pill.disabled { background: var(--sub); color: var(--dim); }
.pill.disabled .dot { background: var(--dim); }
.pill.connected { background: var(--ok-s); color: var(--ok); }
.pill.connected .dot { background: var(--ok); }
.pill.reconnecting { background: var(--warn-s); color: var(--warn); }
.pill.reconnecting .dot { background: var(--warn); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; align-items: start; }
@media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
.src-line { margin: 6px 0 0; padding: 10px 12px; background: var(--sub); border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; white-space: pre-wrap; word-break: break-all; }
.dev-hint { font-size: 11.5px; color: var(--faint); margin-top: 4px; }
</style>
