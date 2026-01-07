<template>
  <div id="shell">
    <MainPage>
      <!-- Vue Router zeigt hier automatisch die aktuelle Seite -->
      <router-view :refresh-url="refreshUrl" />
    </MainPage>
  </div>
</template>

<script>
import MainPage from './components/MainPage.vue';

export default {
  name: 'App',
  components: { MainPage },
  computed: {
    // Props an gerenderte Komponenten weiterreichen
    refreshUrl() {
      try {
        const url = new URL(window.location.href);
        return url.searchParams.get('to') || url.searchParams.get('url') || '';
      } catch (_) {
        return '';
      }
    }
  }
};
</script>

<style>
#shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
