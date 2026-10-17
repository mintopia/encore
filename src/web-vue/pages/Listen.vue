<template>
  <main class="listen">
    <h1 class="wordmark">Encore</h1>
    <section class="frame" aria-label="Now playing">
      <div class="art" aria-hidden="true"></div>
      <p class="idle">Nothing playing</p>
    </section>
  </main>
</template>

<style scoped>
.listen { min-height: 100%; display: grid; place-content: center; justify-items: center; gap: 28px; padding: 24px; }
.wordmark { margin: 0; font-family: var(--disp); font-weight: 700; font-size: 28px; letter-spacing: -0.01em; color: var(--txt); }
.frame { width: min(360px, 100%); background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh2); padding: 20px; display: grid; gap: 16px; }
.art { aspect-ratio: 1; border-radius: 12px; background: var(--sub); border: 1px solid var(--line); }
.idle { margin: 0; text-align: center; color: var(--dim); font-size: 14px; }
</style>
