<template>
  <main class="home-hero">
    <h1 class="home-hero__title" data-text="Wizard">Wizard</h1>

    <div class="home-cta" style="margin-bottom:1rem;">
      <!-- SPA-korrekter Start-Button -->
      <router-link class="btn btn-outline-primary btn-lg" to="/menu">
        Start Game
      </router-link>
    </div>

    <div id="gameArea" style="margin-top:1rem;"></div>
  </main>
</template>

<script>
export default {
  name: 'IndexPage'
};
</script>

<style lang="less">
@import "../../../app/assets/stylesheets/home.less";
</style>
