<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useConfig } from "../../composables/useConfig";
import SectionCard from "../../components/SectionCard.vue";
import LoadingState from "../../components/LoadingState.vue";
import TextField from "../../components/TextField.vue";
import SecretRow from "../../components/SecretRow.vue";
import ToggleSwitch from "../../components/ToggleSwitch.vue";
import type { RelayStatus } from "../../../wire-contract";

const { config, secretSet, loaded } = useConfig();
const c = config as any;

const relay = ref<RelayStatus>({ enabled: false, connected: false, lastConnectAt: null, lastError: null });
let timer: number | undefined;

async function refreshRelay() {
  try {
    const r = await fetch("/api/relay", { credentials: "same-origin" });
    if (r.ok) relay.value = (await r.json()).status;
  } catch { /* keep last known status */ }
}

onMounted(() => { refreshRelay(); timer = window.setInterval(refreshRelay, 3000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });

const pill = computed(() => {
  const s = relay.value;
  if (!s.enabled) return { cls: "disabled", text: "Disabled" };
  if (s.connected) return { cls: "connected", text: "Connected" };
  return { cls: "reconnecting", text: "Reconnecting…" };
});
</script>

<template>
  <LoadingState v-if="!loaded" />
  <SectionCard
    v-else
    title="WebSocket Relay"
    subtitle="Bridge Soloist to an external server: outbound frames are republished, received frames are relayed back as commands."
  >
    <div class="relay-head">
      <div class="relay-pill">
        <span class="pill" :class="pill.cls"><span class="dot"></span>{{ pill.text }}</span>
        <div v-if="relay.enabled && !relay.connected && relay.lastError" class="relay-err" :title="relay.lastError">
          {{ relay.lastError }}
        </div>
      </div>
    </div>
    <div class="grid2">
      <TextField label="Relay URL" placeholder="wss://example.com/relay" v-model="c.relay.url" />
      <SecretRow
        label="Authorization Header" section="relay" field-key="authorization" revealable optional
        :is-set="secretSet['relay.authorization']" v-model="c.relay.authorization"
        hint="Sent as the Authorization header when connecting to the relay server. Optional — leave blank if the relay needs no auth."
      />
    </div>
    <div class="setrow">
      <div class="setrow-txt">
        <div class="setrow-title">Pusher protocol</div>
        <div class="setrow-sub">For Laravel Reverb or other Pusher servers. Frames are sent as client-&lt;type&gt; events on the channel. Events received on the channel are unwrapped and sent to Soloist.</div>
      </div>
      <ToggleSwitch :on="c.relay.pusher" label="Pusher protocol" @toggle="c.relay.pusher = !c.relay.pusher" />
    </div>
    <div v-if="c.relay.pusher" class="grid2 pusher-fields">
      <TextField label="Channel" placeholder="private-soloist" v-model="c.relay.channel" />
      <div></div>
      <TextField label="App key (private channels)" placeholder="REVERB_APP_KEY" v-model="c.relay.appKey" />
      <SecretRow
        label="App secret (private channels)" section="relay" field-key="appSecret" revealable optional
        :is-set="secretSet['relay.appSecret']" v-model="c.relay.appSecret"
        hint="Signs the subscription to private- and presence- channels. Not needed for public channels."
      />
    </div>
  </SectionCard>
</template>

<style scoped>
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; align-items: start; }
@media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
.setrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--line); }
.setrow-txt { min-width: 0; }
.setrow-title { font-size: 14px; font-weight: 600; }
.setrow-sub { font-size: 12.5px; color: var(--dim); margin-top: 2px; }
.pusher-fields { margin-top: 16px; }
.relay-head { display: flex; justify-content: flex-end; margin-bottom: 14px; }
.relay-pill { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.relay-err { font-size: 11.5px; color: var(--faint); max-width: 340px; text-align: right; overflow-wrap: break-word; word-break: break-word; }
.pill.disabled { background: var(--sub); color: var(--dim); }
.pill.disabled .dot { background: var(--dim); }
.pill.connected { background: var(--ok-s); color: var(--ok); }
.pill.connected .dot { background: var(--ok); }
.pill.reconnecting { background: var(--warn-s); color: var(--warn); }
.pill.reconnecting .dot { background: var(--warn); }
</style>
