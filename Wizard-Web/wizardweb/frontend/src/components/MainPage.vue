<template>
  <div class="game" :class="[themeClass, pageClass]">
    <canvas id="starfield" aria-hidden="true"></canvas>
    <div id="page-layer">
      <nav :class="navbarClass">
        <div :class="isIngame ? 'container-ingame' : 'container-fluid ps-2'">
          <a class="navbar-brand d-flex align-items-center" href="/">
            <span class="brand-w">W</span>
          </a>

          <button class="navbar-toggler" type="button" aria-controls="mainNav" aria-expanded="false" aria-label="Navigation umschalten">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="mainNav">
            <ul class="navbar-nav mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link" :class="{active: path === '/rules'}" href="/rules" @click.prevent="navigate('/rules')">Rules</a>
              </li>
              <li class="nav-item">
                <!-- Link to Menu first so players can be configured before entering the game -->
                <a class="nav-link" :class="{active: path === '/menu'}" href="/menu" @click.prevent="navigate('/menu')">Game</a>
              </li>
              <li class="nav-item ms-2 d-flex align-items-center">
                <button type="button" class="btn btn-sm" :class="theme === 'light' ? 'btn-outline-dark' : 'btn-outline-light'" @click="toggleTheme">{{ toggleLabel }}</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <slot />
    </div>
  </div>
  
</template>

<script>
export default {
  name: 'MainPage',
  data(){
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const cookieTheme = (() => {
      try {
        const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : 'dark';
      } catch { return 'auto'; }
    })();
    return {
      path,
      theme: cookieTheme === 'light' || cookieTheme === 'dark' ? cookieTheme : 'dark'
    };
  },
  computed: {
    isHome(){ return this.path === '/' || this.path === '/home'; },
    isIngame(){ return this.path === '/ingame'; },
    pageClass(){ return this.isHome ? 'page-home' : (this.isIngame ? 'page-ingame' : ''); },
    themeClass(){ return this.theme === 'light' ? 'theme-light' : (this.theme === 'dark' ? 'theme-dark' : 'theme-auto'); },
    toggleLabel(){ return this.theme === 'dark' ? 'Light Mode' : 'Dark Mode'; },
    navbarClass(){
      const base = this.theme === 'light' ? 'navbar navbar-expand-lg navbar-light bg-white' : 'navbar navbar-expand-lg navbar-dark bg-dark';
      if (this.isIngame) return base;
      return base + ' fixed-top px-0';
    }
  },
  mounted(){
    try {
      document.documentElement.setAttribute('data-bs-theme', this.theme === 'auto' ? 'auto' : this.theme);
      window.addEventListener('popstate', () => { this.path = window.location.pathname; try { this.updateBodyClasses(); } catch(_) {} });
    } catch(_) {}

    // Ensure body has theme and page classes so legacy LESS rules apply (e.g., body padding)
    try { this.updateBodyClasses(); } catch(_) {}

    // Provide a minimal toastr shim used by some legacy scripts (animatedHands.js)
    try {
      if (!window.toastr) {
        const show = (variant, msg, dur) => {
          try {
            const el = document.createElement('div');
            el.textContent = String(msg || '');
            el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;padding:.5rem .75rem;border-radius:8px;background:rgba(0,0,0,.7);color:#fff;';
            document.body.appendChild(el);
            setTimeout(() => { try { el.remove(); } catch(_){} }, typeof dur==='number'?dur:2500);
          } catch(_) {}
        };
        window.toastr = {
          warning: (m)=>show('warning', m, 3000),
          error:   (m)=>show('danger',  m, 3500),
          success: (m)=>show('success', m, 2000),
          info:    (m)=>show('primary', m, 2500)
        };
      }
    } catch(_) {}

    // Load required vendor scripts (jQuery + Bootstrap bundle) exactly once
    try {
      if (!window.jQuery && !document.querySelector('script[data-vendor-jquery]')){
        const jq = document.createElement('script');
        jq.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
        jq.integrity = 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=';
        jq.crossOrigin = 'anonymous';
        jq.setAttribute('data-vendor-jquery','1');
        document.head.appendChild(jq);
      }
      if (!document.querySelector('script[data-vendor-bs]')){
        const bs = document.createElement('script');
        bs.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
        bs.integrity = 'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz';
        bs.crossOrigin = 'anonymous';
        bs.setAttribute('data-vendor-bs','1');
        document.head.appendChild(bs);
      }
    } catch(_) {}

    // Load legacy scripts after the canvas exists (and after vendor libs are injected)
    try {
      const ensureCanvas = () => document.getElementById('starfield');
      if (ensureCanvas()) {
        const stars = new URL('../../../public/javascripts/stars.js', import.meta.url).href;
        import(/* @vite-ignore */ stars).catch(() => {});
        // Runes background decorations (safe if CSS expects it)
        const runes = new URL('../../../public/javascripts/runes.js', import.meta.url).href;
        import(/* @vite-ignore */ runes).catch(() => {});
        // Animated hands/toastr helpers used by ingame views
        const hands = new URL('../../../public/javascripts/animatedHands.js', import.meta.url).href;
        import(/* @vite-ignore */ hands).catch(() => {});
        // Menu helpers (no-op on pages that don't use it). Delay until jQuery likely available
        const loadMenu = () => {
          try {
            const menu = new URL('../../../public/javascripts/menu.js', import.meta.url).href;
            import(/* @vite-ignore */ menu).catch(() => {});
          } catch(_) {}
        };
        if (window.jQuery) { loadMenu(); }
        else { setTimeout(loadMenu, 100); }
      } else {
        // In rare cases wait a tick until DOM paints, then try again
        setTimeout(() => {
          try {
            const stars = new URL('../../../public/javascripts/stars.js', import.meta.url).href;
            import(/* @vite-ignore */ stars).catch(() => {});
            const runes = new URL('../../../public/javascripts/runes.js', import.meta.url).href;
            import(/* @vite-ignore */ runes).catch(() => {});
            const hands = new URL('../../../public/javascripts/animatedHands.js', import.meta.url).href;
            import(/* @vite-ignore */ hands).catch(() => {});
            const loadMenu = () => {
              try {
                const menu = new URL('../../../public/javascripts/menu.js', import.meta.url).href;
                import(/* @vite-ignore */ menu).catch(() => {});
              } catch(_) {}
            };
            if (window.jQuery) { loadMenu(); }
            else { setTimeout(loadMenu, 100); }
          } catch(_) {}
        }, 0);
      }
    } catch(_) {}
  },
  methods: {
    navigate(to){
      try {
        if (window.location.pathname !== to) {
          history.pushState({}, '', to);
        }
        // notify listeners (App.vue updates its path on popstate)
        try { window.dispatchEvent(new PopStateEvent('popstate')); } catch(_) {}
        // update own path for local active classes/body classes
        this.path = window.location.pathname;
        try { this.updateBodyClasses(); } catch(_) {}
      } catch(_) {
        // Fallback: hard navigation
        window.location.href = to;
      }
    },
    updateBodyClasses(){
      const body = document.body;
      if (!body) return;
      const themeCls = ['theme-light','theme-dark','theme-auto'];
      themeCls.forEach(c => body.classList.remove(c));
      if (this.theme === 'light') body.classList.add('theme-light');
      else if (this.theme === 'dark') body.classList.add('theme-dark');
      else body.classList.add('theme-auto');

      const pageCls = ['page-home','page-ingame'];
      pageCls.forEach(c => body.classList.remove(c));
      const pc = this.isHome ? 'page-home' : (this.isIngame ? 'page-ingame' : '');
      if (pc) body.classList.add(pc);
    },
    toggleTheme(){
      const next = this.theme === 'dark' ? 'light' : 'dark';
      this.theme = next;
      try {
        document.cookie = 'theme=' + encodeURIComponent(next) + '; path=/; max-age=' + (60*60*24*365);
        document.documentElement.setAttribute('data-bs-theme', next);
      } catch(_) {}
      try { this.updateBodyClasses(); } catch(_) {}
    }
  }
}
</script>

<style lang="less">
@import '../../../app/assets/stylesheets/main.less';
</style>