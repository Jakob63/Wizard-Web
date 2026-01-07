<template>
  <div class="game" :class="[themeClass, pageClass]">
    <canvas id="starfield" aria-hidden="true"></canvas>

    <div id="page-layer">
      <nav :class="navbarClass">
        <div :class="isIngame ? 'container-ingame' : 'container-fluid ps-2'">

          <!-- BRAND -->
          <router-link
              class="navbar-brand d-flex align-items-center"
              to="/"
          >
            <span class="brand-w">W</span>
          </router-link>

          <button
              class="navbar-toggler"
              type="button"
              aria-controls="mainNav"
              aria-expanded="false"
              aria-label="Navigation umschalten"
              data-bs-toggle="collapse"
              data-bs-target="#mainNav"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="mainNav">
            <ul class="navbar-nav mb-2 mb-lg-0">

              <li class="nav-item">
                <router-link
                    class="nav-link"
                    to="/rules"
                    :class="{ active: route.path === '/rules' }"
                >
                  Rules
                </router-link>
              </li>

              <li class="nav-item">
                <router-link
                    class="nav-link"
                    to="/menu"
                    :class="{ active: route.path === '/menu' }"
                >
                  Game
                </router-link>
              </li>

              <li class="nav-item ms-2 d-flex align-items-center">
                <button
                    type="button"
                    class="btn btn-sm"
                    :class="theme === 'light'
                    ? 'btn-outline-dark'
                    : 'btn-outline-light'"
                    @click="toggleTheme"
                >
                  {{ toggleLabel }}
                </button>
              </li>

            </ul>
          </div>
        </div>
      </nav>

      <!-- ROUTER CONTENT -->
      <slot />
    </div>
  </div>
</template>

<script>
import { useRoute } from 'vue-router';
export default {
  name: 'MainPage',

  setup() {
    const route = useRoute();
    return { route };
  },

  data() {
    const cookieTheme = (() => {
      try {
        const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : 'dark';
      } catch {
        return 'dark';
      }
    })();

    return {
      theme: cookieTheme === 'light' || cookieTheme === 'dark'
          ? cookieTheme
          : 'dark'
    };
  },

  computed: {
    isHome() {
      return this.route.path === '/' || this.route.path === '/home';
    },
    isIngame() {
      return this.route.path.startsWith('/ingame')
          || this.route.path.startsWith('/play/');
    },
    pageClass() {
      if (this.isHome) return 'page-home';
      if (this.isIngame) return 'page-ingame';
      return '';
    },
    themeClass() {
      return this.theme === 'light' ? 'theme-light' : 'theme-dark';
    },
    toggleLabel() {
      return this.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    },
    navbarClass() {
      const base =
          this.theme === 'light'
              ? 'navbar navbar-expand-lg navbar-light bg-white'
              : 'navbar navbar-expand-lg navbar-dark bg-dark';

      return this.isIngame ? base : base + ' fixed-top px-0';
    }
  },

  watch: {
    // Reagiere sauber auf Routenwechsel
    'route.path'() {
      this.updateBodyClasses();
    }
  },

  mounted() {
    this.applyTheme();
    this.updateBodyClasses();
    this.initToastr();
    this.loadVendorScripts();
    this.initVisuals();
  },

  methods: {
    updateBodyClasses() {
      const body = document.body;
      if (!body) return;

      body.classList.remove(
          'theme-light',
          'theme-dark',
          'page-home',
          'page-ingame'
      );

      body.classList.add(
          this.theme === 'light' ? 'theme-light' : 'theme-dark'
      );

      if (this.isHome) body.classList.add('page-home');
      if (this.isIngame) body.classList.add('page-ingame');
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      this.updateBodyClasses();
    },

    applyTheme() {
      try {
        document.documentElement.setAttribute('data-bs-theme', this.theme);
        document.cookie =
            'theme=' + encodeURIComponent(this.theme) +
            '; path=/; max-age=' + (60 * 60 * 24 * 365);
      } catch (_) {}
    },

    /* ===== Vendor / Visuals (unverändert, nur sauber) ===== */

    initToastr() {
      if (window.toastr) return;

      const show = (msg, dur = 2500) => {
        const el = document.createElement('div');
        el.textContent = String(msg || '');
        el.style.cssText =
            'position:fixed;left:50%;top:16px;transform:translateX(-50%);' +
            'z-index:9999;padding:.5rem .75rem;border-radius:8px;' +
            'background:rgba(0,0,0,.7);color:#fff;';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), dur);
      };

      window.toastr = {
        success: m => show(m, 2000),
        info: m => show(m, 2500),
        warning: m => show(m, 3000),
        error: m => show(m, 3500)
      };
    },

    loadVendorScripts() {
      const inject = (src, attrs = {}) => {
        if (document.querySelector(`script[src="${src}"]`)) return;
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
        document.head.appendChild(s);
      };

      inject('https://code.jquery.com/jquery-3.7.1.min.js', {
        crossorigin: 'anonymous'
      });

      inject(
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
          { crossorigin: 'anonymous' }
      );
    },

    initVisuals() {
      const load = async () => {
        try {
          await import('../../../public/javascripts/stars.js');
          await import('../../../public/javascripts/runes.js');
          await import('../../../public/javascripts/animatedHands.js');
        } catch (_) {}
      };

      if (window.jQuery) load();
      else {
        const i = setInterval(() => {
          if (window.jQuery) {
            clearInterval(i);
            load();
          }
        }, 50);
      }
    }
  }
};
</script>

<style lang="less">
@import "../../../app/assets/stylesheets/main.less";
</style>
