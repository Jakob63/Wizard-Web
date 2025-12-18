<template>
  <div id="endscreen">
    <div class="panel">
      <h1>Spielende</h1>

      <div v-if="sortedPlayers.length" class="score-list">
        <div v-for="(p, idx) in sortedPlayers" :key="p.name + idx" class="row">
          <span class="name">{{ idx + 1 }}. {{ p.name }}</span>
          <span class="pts">{{ p.points }}</span>
        </div>
      </div>
      <div v-else class="hint">Keine Spieler gefunden.</div>

      <div class="actions">
        <a class="btn" href="/">Zurück zum Menü</a>
      </div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'EndscreenPage',
  props: {
    players: {
      type: Array,
      default: () => (window.INGAME_DATA?.players || [])
    }
  },
  computed: {
    sortedPlayers(){
      try {
        return [...this.players].sort((a,b) => (b?.points||0) - (a?.points||0));
      } catch(_) { return []; }
    }
  },
  mounted(){
    // Optional background image similar to legacy Play template
    try {
      const el = this.$el && this.$el.querySelector('#endscreen');
      if (el) {
        const imgUrl = new URL('../../../public/images/backgrounds/Wizard_game_background2_GUI.png', import.meta.url).href;
        el.style.backgroundImage = `url(${imgUrl})`;
      }
    } catch(_) {}
  }
}
</script>

<style>
#endscreen {
  min-height: 100vh;
  background-repeat: no-repeat;
  background-position: center center;
  background-attachment: fixed;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(8px, 2vw, 24px);
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
  font-size: clamp(14px, 1.25vw, 18px);
}

.panel {
  background: rgba(0,0,0,0.45);
  padding: clamp(16px, 3vw, 36px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  text-align: center;
  max-width: min(90vw, 720px);
  width: 100%;
}

h1 {
  margin: 0 0 clamp(12px, 2vw, 20px) 0;
  color: #fff;
  font-size: clamp(20px, 2.2vw, 32px);
}

.score-list {
  display: grid;
  row-gap: clamp(6px, 1.2vw, 12px);
  margin-bottom: clamp(12px, 2vw, 20px);
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 16px;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
}
.name {
  justify-self: start;
  font-weight: 600;
  color: #fff;
}
.pts {
  justify-self: end;
  color: #fff;
}

.hint { opacity: .9; }

.actions { margin-top: clamp(12px, 2vw, 20px); }
.btn {
  display: inline-block;
  padding: 8px 14px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 8px;
  text-decoration: none;
  transition: background .2s ease, transform .05s ease;
}
.btn:hover { background: rgba(255,255,255,0.25); }
.btn:active { transform: translateY(1px); }
</style>