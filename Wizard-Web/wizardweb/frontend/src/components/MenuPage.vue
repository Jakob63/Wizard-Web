<template>
  <main class="container py-4">
    <div id="menu">
      <div class="container">
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
            <select id="presetList" class="form-select">
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
        </div>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: 'MenuPage',
  data(){
    return { selectedCount: 3 };
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
    }
  },
  mounted(){
  }
}
</script>

<style scoped>
/* Make the number buttons reliably small and in one horizontal row */
.player-count-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 1.25rem; /* similar to mb-4 */
}
.player-btn {
  appearance: none;
  border: 1px solid rgba(255,255,255,.35);
  background: transparent; /* no blue background */
  color: inherit; /* follow current theme/text color */
  border-radius: .375rem; /* ~6px */
  padding: .35rem .7rem; /* slightly bigger */
  font-size: .95rem;     /* slightly bigger */
  line-height: 1.2;
  cursor: pointer;
  transition: filter .15s ease-in-out, opacity .15s ease-in-out;
}
.player-btn:hover { filter: none; }
.player-btn:active { filter: none; }

/* Active selection indicator */
.player-btn.active { outline: 2px solid currentColor; outline-offset: 1px; }

/* Subtle hover/active backgrounds depending on theme, without blue */
:root.theme-dark .player-btn:hover { background: rgba(255,255,255,.08); }
:root.theme-dark .player-btn:active { background: rgba(255,255,255,.12); }
:root.theme-light .player-btn:hover { background: rgba(0,0,0,.06); }
:root.theme-light .player-btn:active { background: rgba(0,0,0,.1); }

/* Respect dark/light themes from MainPage if present */
:root.theme-light .player-btn { border-color: rgba(0,0,0,.2); }
</style>
