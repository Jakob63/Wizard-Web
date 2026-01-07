<template>
  <main class="home-hero">
    <h1>Starting the game …</h1>
    <p>Please wait a moment.</p>
    <p class="mt-3">
      <button class="btn btn-primary" @click="goToTarget">Continue</button>
    </p>
  </main>
</template>

<script>
export default {
  name: 'LoadingPage',
  props: {
    refreshUrl: { type: String, default: '' },
    delayMs: { type: Number, default: 800 }
  },
  data() {
    return { timerId: null };
  },
  computed: {
    targetUrl() {
      // Priorität: refreshUrl > URL query 'to' > URL query 'url' > global window.INGAME_URL > default '/ingame'
      if (this.refreshUrl) return this.refreshUrl;
      try {
        const url = new URL(window.location.href);
        return url.searchParams.get('to')
            || url.searchParams.get('url')
            || window.INGAME_URL
            || '/ingame';
      } catch {
        return '/ingame';
      }
    }
  },
  methods: {
    goToTarget() {
      // SPA-freundlich: versucht Router-Push, fallback window.location
      if (this.$router && this.targetUrl) {
        this.$router.push(this.targetUrl).catch(() => {
          window.location.assign(this.targetUrl);
        });
      } else if (this.targetUrl) {
        window.location.assign(this.targetUrl);
      }
    }
  },
  mounted() {
    // Automatisches Weiterleiten nach delayMs
    const t = Math.max(0, Number(this.delayMs) || 0);
    this.timerId = setTimeout(() => this.goToTarget(), t);
  },
  unmounted() {
    if (this.timerId) clearTimeout(this.timerId);
  }
};
</script>

<style lang="less" scoped>
@import "../../../app/assets/stylesheets/home.less";

.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;

  h1 { font-size: 2rem; margin-bottom: 1rem; }
  p { font-size: 1.1rem; }
  .btn-primary { padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
}
</style>
