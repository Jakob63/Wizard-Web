<template>
  <div class="game" :class="pageClass">
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
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <router-link class="nav-link" to="/rules">Rules</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/menu">Game</router-link>
              </li>
            </ul>
            <ul class="navbar-nav mb-2 mb-lg-0">
              <li class="nav-item" v-if="!user">
                <router-link class="nav-link" to="/login">Login</router-link>
              </li>
              <li class="nav-item" v-if="!user">
                <router-link class="nav-link" to="/register">Register</router-link>
              </li>
              <li class="nav-item" v-if="user">
                <span class="nav-link text-info">Logged in as {{ user.displayName || user.email || 'User' }}</span>
              </li>
              <li class="nav-item" v-if="user">
                <a class="nav-link" href="#" @click.prevent="$emit('logout')">Logout</a>
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
import { BACKEND } from '../api/client';
export default {
  name: 'MainPage',
  props: ['user'],
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
    toggleLabel(){ return this.theme === 'dark' ? 'Light Mode' : 'Dark Mode'; },
    navbarClass(){
      const base = this.theme === 'light' ? 'navbar navbar-expand-lg navbar-light bg-white' : 'navbar navbar-expand-lg navbar-dark bg-dark';
      if (this.isIngame) return base;
      return base + ' fixed-top px-0';
    }
  },
  watch: {
    '$route'(to) {
      this.path = to.path;
      try { this.updateBodyClasses(); } catch(_) {}
    }
  },
  mounted(){
    try {
      const theme = this.theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : this.theme;
      document.documentElement.setAttribute('data-bs-theme', this.theme === 'auto' ? 'auto' : this.theme);
      if (this.theme === 'auto') {
        // Simple auto handling for body classes
        const updateAuto = (e) => {
          if (this.theme === 'auto') {
            this.updateBodyClasses();
          }
        };
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateAuto);
      }
    } catch(_) {}

    try { this.updateBodyClasses(); } catch(_) {}

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

    const injectScript = (src, attrs = {}, onload) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      Object.entries(attrs).forEach(([k,v]) => s.setAttribute(k, v));
      if (onload) s.onload = onload;
      document.head.appendChild(s);
      return s;
    };

    try {
      if (!window.jQuery && !document.querySelector('script[data-vendor-jquery]')){
        injectScript('https://code.jquery.com/jquery-3.7.1.min.js', {
          'data-vendor-jquery': '1',
          crossorigin: 'anonymous',
          integrity: 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo='
        });
      }
      if (!document.querySelector('script[data-vendor-bs]')){
        injectScript('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js', {
          'data-vendor-bs': '1',
          crossorigin: 'anonymous',
          integrity: 'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz'
        });
      }
    } catch(_) {}

    const installAjaxCompat = () => {
      try {
        if (!window.jQuery) return;
        const $ = window.jQuery;
        $.ajaxPrefilter(function(options, originalOptions, jqXHR){
          try {
            if (typeof options.url === 'string' && (
                options.url.startsWith('/api/') ||
                options.url.startsWith('/pwa/api/') ||
                options.url.startsWith('/assets/')
              )) {
              options.url = `${BACKEND}${options.url}`;
              options.xhrFields = { ...(options.xhrFields||{}), withCredentials: true };
            }
          } catch(_) {}
        });
        if (!window.postJson) {
          window.postJson = function(url, data){
            return $.ajax({ url, method: 'POST', data: JSON.stringify(data||{}), contentType: 'application/json', dataType: 'json' });
          };
        }
        if (!window.apiCall) {
          window.apiCall = function(method, url, data){
            return $.ajax({ url, method: method||'GET', data: data ? JSON.stringify(data) : undefined, contentType: data? 'application/json' : undefined, dataType: 'json' });
          };
        }
      } catch(_) {}
    };

    try {
      const ensureCanvas = () => document.getElementById('starfield');
      const loadVisuals = () => {
        try {
          const stars = new URL('../../../public/javascripts/stars.js', import.meta.url).href;
          import(/* @vite-ignore */ stars);
          const runes = new URL('../../../public/javascripts/runes.js', import.meta.url).href;
          import(/* @vite-ignore */ runes);
          const hands = new URL('../../../public/javascripts/animatedHands.js', import.meta.url).href;
          import(/* @vite-ignore */ hands);
        } catch(_) {}
      };

      const startWhenJqReady = () => {
        if (window.jQuery) {
          installAjaxCompat();
          loadVisuals();
        } else {
          const iv = setInterval(() => {
            if (window.jQuery) {
              clearInterval(iv);
              installAjaxCompat();
              loadVisuals();
            }
          }, 50);
        }
      };

      if (ensureCanvas()) startWhenJqReady(); else setTimeout(startWhenJqReady, 0);
    } catch(_) {}
  },
  methods: {
    updateBodyClasses(){
      const body = document.body;
      if (!body) return;
      const themeCls = ['theme-light','theme-dark','theme-auto'];
      themeCls.forEach(c => body.classList.remove(c));
      
      let effectiveTheme = this.theme;
      if (effectiveTheme === 'auto') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        body.classList.add('theme-auto');
      }
      
      if (effectiveTheme === 'light') body.classList.add('theme-light');
      else body.classList.add('theme-dark');

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
      
      // Dispatch event to notify non-Vue scripts (like stars.js and runes.js)
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: next } }));

      if (next === 'light' && this.isHome) {
        try {
          const runes = new URL('../../../public/javascripts/runes.js', import.meta.url).href;
          import(/* @vite-ignore */ runes);
        } catch(_) {}
      }
    }
  }
}
</script>

<style lang="less">
@import '../../../app/assets/stylesheets/main.less';
</style>