<template>
  <main class="home-hero">
    <h1 class="home-hero__title" data-text="Wizard">Wizard</h1>
    <div class="home-cta" style="margin-bottom:1rem;">
      <a class="btn btn-outline-primary btn-lg" href="#" @click.prevent="start">Start Game</a>
    </div>
    <div id="gameArea" style="margin-top:1rem;"></div>
  </main>
</template>

<script>
export default {
  name: 'IndexPage',
  methods: {
    start(){
      try {
        if (typeof window.start_game === 'function') { window.start_game(); return; }
        window.location.href = '/menu';
        return;
      } catch(_) {}
      try { window.location.href = '/menu'; } catch(_) {}
    },
    send(){
      try {
        const btn = document.getElementById('sendButton');
        if (btn) btn.dispatchEvent(new CustomEvent('index-send-click'));
      } catch(_) {}
    }
  }
}
</script>

<style lang="less">
@import '@playstyles/home.less';
</style>
