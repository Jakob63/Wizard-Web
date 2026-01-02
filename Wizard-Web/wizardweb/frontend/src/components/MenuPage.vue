<template>
  <main class="container py-4">
    <div id="menu">
      <div class="container">
        <div v-if="isOffline" class="alert alert-warning d-flex justify-content-between align-items-center" role="alert">
          <span>Du bist offline. Einige Funktionen sind nicht verfügbar.</span>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="showOfflineGame = !showOfflineGame">
              {{ showOfflineGame ? 'Mini‑Game ausblenden' : 'Mini‑Game spielen' }}
            </button>
          </div>
        </div>

        <!-- Spieleranzahl wählen -->
        <div class="row mb-2">
          <p class="lead mb-0">Bitte Spieleranzahl wählen</p>
        </div>
        <div class="player-count-row">
          <button type="button" class="player-btn" :class="{active: selectedCount===3}" @click="selectCount(3)">3</button>
          <button type="button" class="player-btn" :class="{active: selectedCount===4}" @click="selectCount(4)">4</button>
          <button type="button" class="player-btn" :class="{active: selectedCount===5}" @click="selectCount(5)">5</button>
          <button type="button" class="player-btn" :class="{active: selectedCount===6}" @click="selectCount(6)">6</button>
        </div>

        <!-- Spielernamen: standardmäßig 3, dynamisch erweitert -->
        <div id="nameForm">
          <input type="hidden" id="playerCount" :value="selectedCount" />

          <div class="mb-3">
            <label for="presetList" class="form-label">Voreinstellung</label>
            <select id="presetList" class="form-select" @change="onPresetChange">
              <option value="">– bitte wählen –</option>
              <option value="1">Standard</option>
              <option value="2">Janisette</option>
            </select>
          </div>

          <div v-for="n in selectedCount" :key="n" class="mb-3">
            <label :for="'name'+n" class="form-label">{{ 'Spieler ' + n }}</label>
            <input type="text" class="form-control" :id="'name'+n" :name="'name'+n" placeholder="Name" required>
          </div>

          <div id="namesError" class="text-danger" style="display:none"></div>

          <div class="mt-3 d-flex gap-2">
            <button type="button" class="btn btn-primary" @click="startGame">Spiel starten</button>
            <button type="button" class="btn btn-outline-secondary" @click="clearNames">Leeren</button>
          </div>
        </div>

        <div class="mt-4" v-if="showOfflineGame">
          <OfflineGame @close="showOfflineGame=false" />
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { apiGet, apiPost } from '../api/client';
import OfflineGame from './OfflineGame.vue';
export default {
  name: 'MenuPage',
  components: { OfflineGame },
  data(){
    return {
      selectedCount: 3,
      submitting: false,
      isOffline: (typeof navigator !== 'undefined' ? !navigator.onLine : false),
      showOfflineGame: false
    };
  },
  methods: {
    selectCount(n){
      const v = Number(n);
      if (v >= 3 && v <= 6) {
        this.selectedCount = v;
        this.$nextTick(() => {
          try {
            const inputs = Array.from(document.querySelectorAll('#nameForm input[id^="name"]'));
            const empty = inputs.find(i => !i.value);
            (empty || inputs[0])?.focus();
          } catch(_) {}
        });
      }
    },
    onPresetChange(e){
      try {
        const id = String(e?.target?.value || '').trim();
        if (!id) return;
        apiGet(`/pwa/api/playerPresets/${encodeURIComponent(id)}`)
          .then((data) => {
            try {
              const arr = Array.isArray(data?.players) ? data.players : [];
              if (arr.length >= 3 && arr.length <= 6) this.selectedCount = arr.length;
              this.$nextTick(() => {
                for (let i = 1; i <= 6; i++) {
                  const el = document.getElementById('name' + i);
                  if (!el) continue;
                  el.value = arr[i-1] || '';
                }
              });
              this.hideError();
            } catch(_) {}
          })
          .catch(() => { this.showError('Preset konnte nicht geladen werden.'); });
      } catch(_) {}
    },
    collectNames(){
      const names = [];
      try {
        for (let i = 1; i <= this.selectedCount; i++) {
          const el = document.getElementById('name' + i);
          const v = (el?.value || '').trim();
          names.push(v);
        }
      } catch(_) {}
      return names;
    },
    validateNames(names){
      if (!Array.isArray(names)) return 'Interner Fehler bei der Namenserfassung.';
      if (names.length < 3 || names.length > 6) return 'Bitte 3 bis 6 Spieler angeben.';
      if (names.some(n => !n)) return 'Alle Namen müssen ausgefüllt sein.';
      return '';
    },
    showError(msg){
      try {
        const box = document.getElementById('namesError');
        if (box) { box.textContent = msg || ''; box.style.display = msg ? 'block' : 'none'; }
      } catch(_) {}
    },
    hideError(){ this.showError(''); },
    clearNames(){
      try {
        for (let i = 1; i <= 6; i++) {
          const el = document.getElementById('name' + i);
          if (el) el.value = '';
        }
        this.hideError();
      } catch(_) {}
    },
    async startGame(){
      if (this.submitting) return;
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.showError('Du bist offline. Spiele das Mini‑Game, bis die Verbindung wieder da ist.');
          this.showOfflineGame = true;
          return;
        }
      } catch(_) {}
      const names = this.collectNames();
      const err = this.validateNames(names);
      if (err) { this.showError(err); return; }
      this.submitting = true;
      this.hideError();
      try {
        const res = await apiPost('/pwa/api/players', { players: names });
        const target = (res && (res.first || res.tabs?.[0])) || '/ingame';
        try {
          if (window.history && typeof window.history.pushState === 'function') {
            window.history.pushState({}, '', target);
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            window.location.href = target;
          }
        } catch(_) { window.location.href = target; }
      } catch(e){
        let msg = 'Spielstart fehlgeschlagen.';
        try {
          // Robust Offline/Netzfehler-Erkennung:
          // - navigator.onLine kann bei SW-Offline noch true sein
          // - fetch wirft TypeError ohne status
          // - Chromium meldet ERR_INTERNET_DISCONNECTED im message-Text
          const m = String(e && (e.message || e.toString()) || '').toLowerCase();
          const isTypeErr = (e && e.name === 'TypeError');
          const statusOffline = (e && (e.status === 0 || e.status === 503));
          const msgOffline = m.includes('failed to fetch') || m.includes('networkerror') || m.includes('err_internet_disconnected') || m.includes('network changed');
          const navOffline = (typeof navigator !== 'undefined' && !navigator.onLine);
          const isNetErr = statusOffline || isTypeErr || msgOffline || navOffline;
          if (isNetErr) {
            msg = 'Keine Verbindung – du kannst solange offline spielen.';
            this.showOfflineGame = true;
          }
        } catch(_) {}
        try { if (e && e.body && e.body.error) msg = e.body.error; } catch(_) {}
        this.showError(msg);
      } finally {
        this.submitting = false;
      }
    }
  },
  mounted(){
    try {
      this._onOnline = () => { this.isOffline = false; this.showOfflineGame = false; this.hideError(); };
      this._onOffline = () => { this.isOffline = true; };
      window.addEventListener('online', this._onOnline);
      window.addEventListener('offline', this._onOffline);
      if (this.isOffline) {
        this.showError('Du bist offline. Einige Funktionen sind nicht verfügbar.');
      }
    } catch(_) {}
  },
  beforeUnmount(){
    try {
      if (this._onOnline) window.removeEventListener('online', this._onOnline);
      if (this._onOffline) window.removeEventListener('offline', this._onOffline);
    } catch(_) {}
  }
}
</script>

<style scoped>
.player-count-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 1.25rem;
}
.player-btn {
  appearance: none;
  border: 1px solid rgba(255,255,255,.35);
  background: transparent;
  color: inherit;
  border-radius: .375rem;
  padding: .35rem .7rem;
  font-size: .95rem;
  line-height: 1.2;
  cursor: pointer;
  transition: filter .15s ease-in-out, opacity .15s ease-in-out;
}
.player-btn:hover { filter: none; }
.player-btn:active { filter: none; }

.player-btn.active { outline: 2px solid currentColor; outline-offset: 1px; }

.theme-dark .player-btn:hover { background: rgba(255,255,255,.08); }
.theme-dark .player-btn:active { background: rgba(255,255,255,.12); }
.theme-light .player-btn:hover { background: rgba(0,0,0,.06); }
.theme-light .player-btn:active { background: rgba(0,0,0,.1); }

.theme-light .player-btn { border-color: rgba(0,0,0,.2); }
</style>
