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
import { BACKEND } from '../api/client.js';

export default {
  name: 'MainPage',
  data() {
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
    isHome() { return this.path === '/' || this.path === '/home'; },
    isIngame() { return this.path.startsWith('/ingame') || this.path.startsWith('/play/'); },
    pageClass() { return this.isHome ? 'page-home' : (this.isIngame ? 'page-ingame' : ''); },
    themeClass() { return this.theme === 'light' ? 'theme-light' : (this.theme === 'dark' ? 'theme-dark' : 'theme-auto'); },
    toggleLabel() { return this.theme === 'dark' ? 'Light Mode' : 'Dark Mode'; },
    navbarClass() {
      const base = this.theme === 'light'
          ? 'navbar navbar-expand-lg navbar-light bg-white'
          : 'navbar navbar-expand-lg navbar-dark bg-dark';
      return this.isIngame ? base : base + ' fixed-top px-0';
    }
  },
  mounted() {
    // Theme setzen
    this.applyTheme();

    // Popstate listener
    window.addEventListener('popstate', () => {
      this.path = window.location.pathname;
      this.updateBodyClasses();
    });

    // Toastr fallback
    this.initToastr();

    // Vendor Scripts
    this.loadVendorScripts();

    // Starfield & visuals
    this.initVisuals();
  },
  methods: {
    navigate(to) {
      try {
        if (window.location.pathname !== to) history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        this.path = window.location.pathname;
        this.updateBodyClasses();
      } catch(_) { window.location.href = to; }
    },
    updateBodyClasses() {
      const body = document.body;
      if (!body) return;

      // Theme
      body.classList.remove('theme-light','theme-dark','theme-auto');
      body.classList.add(this.theme === 'light' ? 'theme-light' : 'theme-dark');

      // Page
      body.classList.remove('page-home','page-ingame');
      const pc = this.isHome ? 'page-home' : (this.isIngame ? 'page-ingame' : '');
      if (pc) body.classList.add(pc);
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      this.updateBodyClasses();
    },
    applyTheme() {
      try {
        if(this.theme === 'auto') {
          const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-bs-theme', this.theme);
        }
        document.cookie = 'theme=' + encodeURIComponent(this.theme) + '; path=/; max-age=' + (60*60*24*365);
      } catch(_) {}
    },
    initToastr() {
      if (window.toastr) return;
      const show = (variant, msg, dur) => {
        try {
          const el = document.createElement('div');
          el.textContent = String(msg || '');
          el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;padding:.5rem .75rem;border-radius:8px;background:rgba(0,0,0,.7);color:#fff;';
          document.body.appendChild(el);
          setTimeout(() => el.remove(), typeof dur==='number'?dur:2500);
        } catch(_) {}
      };
      window.toastr = { warning:(m)=>show('warning',m,3000), error:(m)=>show('danger',m,3500), success:(m)=>show('success',m,2000), info:(m)=>show('primary',m,2500) };
    },
    loadVendorScripts() {
      const injectScript = (src, attrs = {}, onload) => {
        const s = document.createElement('script');
        s.src = src; s.defer = true;
        Object.entries(attrs).forEach(([k,v]) => s.setAttribute(k,v));
        if(onload) s.onload = onload;
        document.head.appendChild(s);
        return s;
      };

      // jQuery
      if(!window.jQuery && !document.querySelector('script[data-vendor-jquery]')){
        injectScript('https://code.jquery.com/jquery-3.7.1.min.js', {
          'data-vendor-jquery':'1', crossorigin:'anonymous', integrity:'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo='
        });
      }

      // Bootstrap
      if(!document.querySelector('script[data-vendor-bs]')){
        injectScript('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js', {
          'data-vendor-bs':'1', crossorigin:'anonymous', integrity:'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz'
        });
      }
    },
    initVisuals() {
      const startVisuals = () => {
        try {
          const stars = new URL('../../../public/javascripts/stars.js', import.meta.url).href;
          import(/* @vite-ignore */ stars);
          const runes = new URL('../../../public/javascripts/runes.js', import.meta.url).href;
          import(/* @vite-ignore */ runes);
          const hands = new URL('../../../public/javascripts/animatedHands.js', import.meta.url).href;
          import(/* @vite-ignore */ hands);
        } catch(_) {}
      };

      const waitForJQuery = () => {
        if(window.jQuery) startVisuals();
        else setInterval(() => { if(window.jQuery){ startVisuals(); clearInterval(this); } }, 50);
      };

      if(document.getElementById('starfield')) waitForJQuery();
      else setTimeout(waitForJQuery, 0);
    }
  }
}
</script>

<style lang="less">
@import "../../../app/assets/stylesheets/main.less";
</style>
