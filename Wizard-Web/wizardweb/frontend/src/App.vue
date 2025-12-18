<template>
  <div id="shell">
    <MainPage>
      <component :is="viewComponent" :refresh-url="refreshUrl" />
    </MainPage>
  </div>

</template>

<script>
import IndexPage from './components/IndexPage.vue'
import HomePage from './components/HomePage.vue'
import IngamePage from './components/IngamePage.vue'
import LoadingPage from './components/LoadingPage.vue'
import EndscreenPage from './components/EndscreenPage.vue'
import RulesPage from './components/RulesPage.vue'
import MenuPage from './components/MenuPage.vue'
import MainPage from './components/MainPage.vue'
export default {
  name: 'App',
  components: { IndexPage, HomePage, IngamePage, LoadingPage, EndscreenPage, RulesPage, MenuPage, MainPage },
  data(){
    const normalize = (p) => {
      try {
        if (!p) return '/';
        // Collapse multiple slashes to a single slash
        let n = p.replace(/\/+?/g, '/');
        // Ensure it starts with exactly one leading slash
        if (!n.startsWith('/')) n = '/' + n;
        // Remove trailing slash except for root
        if (n.length > 1 && n.endsWith('/')) n = n.substring(0, n.length - 1);
        return n;
      } catch(_) { return '/'; }
    };
    const raw = typeof window !== 'undefined' ? window.location.pathname : '/';
    const path = normalize(raw);
    // If normalization changed the URL, update it without reloading
    try {
      if (typeof window !== 'undefined' && path !== raw && window.history && window.history.replaceState) {
        window.history.replaceState({}, '', path + window.location.search + window.location.hash);
      }
    } catch(_) {}
    return { path };
  },
  computed: {
    viewComponent(){
      // Map simple paths to pages; treat /play/:name like ingame (single-hand view)
      if (this.path && this.path.startsWith('/play/')) return 'IngamePage';
      switch (this.path) {
        case '/loading': return 'LoadingPage';
        case '/ingame': return 'IngamePage';
        case '/endscreen': return 'EndscreenPage';
        case '/menu': return 'MenuPage';
        case '/rules': return 'RulesPage';
        case '/home': return 'HomePage';
        case '/':
        default: return 'IndexPage';
      }
    },
    refreshUrl(){
      try {
        const url = new URL(window.location.href);
        return url.searchParams.get('to') || url.searchParams.get('url') || '';
      } catch(_) { return ''; }
    }
  },
  mounted(){
    const normalize = (p) => {
      try {
        if (!p) return '/';
        let n = p.replace(/\/+?/g, '/');
        if (!n.startsWith('/')) n = '/' + n;
        if (n.length > 1 && n.endsWith('/')) n = n.substring(0, n.length - 1);
        return n;
      } catch(_) { return '/'; }
    };
    try {
      window.addEventListener('popstate', () => { this.path = normalize(window.location.pathname); });
    } catch(_) {}
  }
}
</script>

<style>
#shell { min-height: 100vh; display: flex; flex-direction: column; }
</style>