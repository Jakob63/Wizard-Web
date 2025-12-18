<template>
  <main class="home-hero">
    <h1>Starting the game …</h1>
    <p>Please wait a moment.</p>
    <p class="mt-3">
      <a class="btn btn-primary" :href="targetUrl">Continue</a>
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
  computed: {
    targetUrl(){
      try {
        if (this.refreshUrl && typeof this.refreshUrl === 'string') return this.refreshUrl;
      } catch(_) {}
      try {
        const url = new URL(window.location.href);
        // support multiple query keys
        return url.searchParams.get('to')
            || url.searchParams.get('url')
            || window.INGAME_URL
            || '/ingame';
      } catch(_) { return '/ingame'; }
    }
  },
  mounted(){
    try {
      const t = Math.max(0, Number(this.delayMs) || 0);
      setTimeout(() => {
        try { window.location.assign(this.targetUrl); } catch(_) { window.location.href = this.targetUrl; }
      }, t);
    } catch(_) {}
  }
}
</script>

<style lang="less">
@import '../../../app/assets/stylesheets/home.less';
</style>
