<template>
  <main class="container py-4">
    <div id="menu">
      <div class="container">

        <!-- Offline Hinweis -->
        <div
            v-if="isOffline"
            class="alert alert-warning d-flex justify-content-between align-items-center"
            role="alert"
        >
          <span>Du bist offline. Einige Funktionen sind nicht verfügbar.</span>
          <div class="d-flex gap-2">
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="goOfflineGame"
            >
              Mini-Game spielen
            </button>
          </div>
        </div>

        <!-- Spieleranzahl -->
        <div class="row mb-2">
          <p class="lead mb-0">Bitte Spieleranzahl wählen</p>
        </div>

        <div class="player-count-row">
          <button
              v-for="n in 4"
              :key="n + 2"
              type="button"
              class="player-btn"
              :class="{ active: selectedCount === n + 2 }"
              @click="selectCount(n + 2)"
          >
            {{ n + 2 }}
          </button>
        </div>

        <!-- Spielernamen -->
        <div id="nameForm">
          <div class="mb-3">
            <label for="presetList" class="form-label">Voreinstellung</label>
            <select
                id="presetList"
                class="form-select"
                @change="onPresetChange"
            >
              <option value="">– bitte wählen –</option>
              <option value="1">Standard</option>
              <option value="2">Janisette</option>
            </select>
          </div>

          <div
              v-for="n in selectedCount"
              :key="n"
              class="mb-3"
          >
            <label
                :for="'name' + n"
                class="form-label"
            >
              Spieler {{ n }}
            </label>
            <input
                type="text"
                class="form-control"
                :id="'name' + n"
                placeholder="Name"
                required
            >
          </div>

          <div
              id="namesError"
              class="text-danger"
              v-show="errorMsg"
          >
            {{ errorMsg }}
          </div>

          <div class="mt-3 d-flex gap-2">
            <button
                type="button"
                class="btn btn-primary"
                :disabled="submitting"
                @click="startGame"
            >
              Spiel starten
            </button>
            <button
                type="button"
                class="btn btn-outline-secondary"
                @click="clearNames"
            >
              Leeren
            </button>
          </div>
        </div>

      </div>
    </div>
  </main>
</template>

<script>
import { apiGet, apiPost } from '../api/client.js';

export default {
  name: 'MenuPage',

  data() {
    return {
      selectedCount: 3,
      submitting: false,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      errorMsg: ''
    };
  },

  methods: {
    selectCount(n) {
      if (n < 3 || n > 6) return;
      this.selectedCount = n;
      this.$nextTick(() => {
        const firstEmpty =
            Array.from(document.querySelectorAll('#nameForm input[id^="name"]'))
                .find(i => !i.value)
            || document.querySelector('#nameForm input[id^="name"]');
        firstEmpty?.focus();
      });
    },

    onPresetChange(e) {
      const id = String(e?.target?.value || '').trim();
      if (!id) return;

      apiGet(`/pwa/api/playerPresets/${encodeURIComponent(id)}`)
          .then(data => {
            const players = Array.isArray(data?.players) ? data.players : [];
            if (players.length >= 3 && players.length <= 6) {
              this.selectedCount = players.length;
            }

            this.$nextTick(() => {
              players.forEach((name, i) => {
                const el = document.getElementById('name' + (i + 1));
                if (el) el.value = name;
              });
            });

            this.hideError();
          })
          .catch(() => {
            this.showError('Preset konnte nicht geladen werden.');
          });
    },

    collectNames() {
      return Array.from({ length: this.selectedCount }, (_, i) => {
        const el = document.getElementById('name' + (i + 1));
        return (el?.value || '').trim();
      });
    },

    validateNames(names) {
      if (!Array.isArray(names)) return 'Interner Fehler.';
      if (names.length < 3 || names.length > 6) return 'Bitte 3 bis 6 Spieler angeben.';
      if (names.some(n => !n)) return 'Alle Namen müssen ausgefüllt sein.';
      return '';
    },

    showError(msg) { this.errorMsg = msg; },
    hideError() { this.errorMsg = ''; },

    clearNames() {
      for (let i = 1; i <= 6; i++) {
        const el = document.getElementById('name' + i);
        if (el) el.value = '';
      }
      this.hideError();
    },

    async startGame() {
      if (this.submitting) return;

      const names = this.collectNames();
      const err = this.validateNames(names);
      if (err) { this.showError(err); return; }

      if (this.isOffline) {
        this.showError('Keine Verbindung – spiele solange das Mini-Game.');
        this.goOfflineGame();
        return;
      }

      this.submitting = true;
      this.hideError();

      try {
        const res = await apiPost('/pwa/api/players', { players: names });
        const target = (res && (res.first || res.tabs?.[0])) || '/ingame';

        // ✅ Vue Router Navigation
        await this.$router.push(target);
      } catch (e) {
        this.showError('Spielstart fehlgeschlagen.');
      } finally {
        this.submitting = false;
      }
    },

    goOfflineGame() {
      // SPA-konforme Navigation zum Mini-Game
      this.$router.push('/offline');
    }
  },

  mounted() {
    this._onOnline = () => { this.isOffline = false; this.hideError(); };
    this._onOffline = () => { this.isOffline = true; };

    window.addEventListener('online', this._onOnline);
    window.addEventListener('offline', this._onOffline);

    if (this.isOffline) {
      this.showError('Du bist offline. Einige Funktionen sind nicht verfügbar.');
    }
  },

  beforeUnmount() {
    window.removeEventListener('online', this._onOnline);
    window.removeEventListener('offline', this._onOffline);
  }
};
</script>

<style scoped>
.player-count-row {
  display: flex;
  gap: 8px;
  margin-bottom: 1.25rem;
}

.player-btn {
  border: 1px solid rgba(255,255,255,.35);
  background: transparent;
  color: inherit;
  border-radius: .375rem;
  padding: .35rem .7rem;
  cursor: pointer;
}

.player-btn.active {
  outline: 2px solid currentColor;
}

.theme-dark .player-btn:hover {
  background: rgba(255,255,255,.08);
}

.theme-light .player-btn:hover {
  background: rgba(0,0,0,.06);
}
</style>
