<template>
  <main>
    <div class="game__main bg-ingame" :style="{ backgroundImage: bgStyle }">
      <div class="ingrid">
        <div class="ingrid-row">
          <!-- Left: Trump -->
          <div class="ingrid-col ingrid-col--left">
            <section class="game__section game__section--trump" aria-label="Trump">
              <div class="title">Trump: {{ trumpLabel }}</div>
              <div v-if="cTrump">
                <img class="img-fluid" loading="lazy" :src="cardImg(cTrump)" :alt="cardText(cTrump)" />
              </div>
            </section>
          </div>

          <!-- Center: Current trick -->
          <div class="ingrid-col ingrid-col--center">
            <section class="game__section" aria-label="Current Trick">
              <div class="title">Current Trick:</div>
              <div style="display:flex" v-if="cTrick && cTrick.length">
                <div class="card" v-for="(card, i) in cTrick" :key="'trick-'+i">
                  <img class="img-fluid" loading="lazy" :src="cardImg(card)" :alt="cardText(card)" />
                </div>
              </div>
            </section>
          </div>

          <!-- Right: Scoreboard web component -->
          <div class="ingrid-col ingrid-col--right">
            <section class="game__section game__section--scoreboard" aria-label="Scoreboard">
              <div class="title">Scoreboard</div>
              <wizard-score id="ingame-score" no-title></wizard-score>
            </section>
          </div>
        </div>
      </div>

      <div id="ingame-vue-root" class="ingrid">
        <!-- Players overview -->
        <div class="ingrid-row pad-1" v-if="players && players.length">
          <section class="game__section" aria-label="Players overview">
            <div class="title">Players:</div>
            <div>{{ players.map(p => p.name).join(', ') }}</div>
          </section>
        </div>

        <!-- Hands: either all players (on /ingame) or a single player (on /play/:name) -->
        <template v-if="isIngamePath">
          <div class="ingrid-row pad-1" v-for="(p, pIdx) in cPlayers" :key="'hand-'+pIdx">
            <section class="game__section game__hand" :aria-label="'Hand of ' + p.name">
              <div class="inline-center pad-1">
                <div class="player-name">{{ p.name }}</div>
                <!-- Bid input visible only when this player is prompted to bid -->
                <div v-if="isBidTurnFor(p.name)" class="bid-box">
                  <label class="visually-hidden" :for="'bid-' + pIdx">Ansage für {{ p.name }}</label>
                  <input type="number"
                         class="bid-input"
                         :id="'bid-' + pIdx"
                         :placeholder="'Bid (0–' + (handForIndex(pIdx).length || 0) + ') '"
                         name="bid"
                         :max="handForIndex(pIdx).length || 0"
                         min="0"
                         v-model.number="bidValue"
                         @keyup.enter.prevent="submitBid(p.name)"
                         required>
                  <button type="button" class="bid-submit" @click="submitBid(p.name)">OK</button>
                  <span class="text-danger" v-if="bidError">{{ bidError }}</span>
                </div>
              </div>
              <div class="hand-cards">
                <div class="md-3" v-for="(card, idx) in handForIndex(pIdx)" :key="'c-'+idx">
                  <div class="card-slot">
                    <img class="img-fluid card-img"
                         :class="{ clickable: isCardTurnFor(p.name) }"
                         :data-card-id="idx+1"
                         :title="cardText(card)"
                         :src="cardImg(card)"
                         alt=""
                         @click="maybePlay(p.name, idx+1)" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </template>
        <template v-else>
          <div class="ingrid-row pad-1" v-if="me">
            <section class="game__section game__hand" :aria-label="'Hand of ' + me.name">
              <div class="inline-center pad-1">
                <div class="player-name">{{ me.name }}</div>
                <!-- Single-hand view: show bid for me when it's my turn to bid -->
                <div v-if="isBidTurnFor(me?.name)" class="bid-box">
                  <label class="visually-hidden" :for="'bid-' + meIdx">Ansage für {{ me?.name }}</label>
                  <input type="number"
                         class="bid-input"
                         :id="'bid-' + meIdx"
                         :placeholder="'Bid (0–' + (meCards.length || 0) + ') '"
                         name="bid"
                         :max="meCards.length || 0"
                         min="0"
                         v-model.number="bidValue"
                         @keyup.enter.prevent="submitBid(me?.name)"
                         required>
                  <button type="button" class="bid-submit" @click="submitBid(me?.name)">OK</button>
                  <span class="text-danger" v-if="bidError">{{ bidError }}</span>
                </div>
              </div>
              <div class="hand-cards">
                <div class="md-3" v-for="(card, idx) in meCards" :key="'m-'+idx">
                  <div class="card-slot">
                    <img class="img-fluid card-img"
                         :class="{ clickable: isCardTurnFor(me?.name) }"
                         :data-card-id="idx+1"
                         :title="cardText(card)"
                         :src="cardImg(card)"
                         alt=""
                         @click="maybePlay(me?.name, idx+1)" />
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div class="ingrid-row pad-1" v-else>
            <section class="game__section">
              <div class="text-danger">Unknown player. Please restart via the menu.</div>
            </section>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: 'IngamePage',
  props: {
    players: { type: Array, default: () => (window.INGAME_DATA?.players || []) },
    trumpCard: { type: Object, default: () => (window.INGAME_DATA?.trumpCard || null) },
    trickCards: { type: Array, default: () => (window.INGAME_DATA?.trickCards || []) }
  },
  data(){
    const path = typeof window !== 'undefined' ? window.location.pathname : '/ingame';
    return {
      path,
      // Local reactive state fed by /api/gameState
      localPlayers: [],
      localTrumpCard: null,
      localTrickCards: [],
      localHands: [],
      localHandCards: [],
      round: 0,
      pollId: null,
      // bidding ui
      localCurrentPromptPlayer: '',
      localCurrentPromptKind: '',
      bidValue: 0,
      bidError: ''
    };
  },
  computed: {
    isIngamePath(){ return this.path === '/ingame'; },
    // Computed sources preferring live API state over props/defaults
    cPlayers(){ return (this.localPlayers && this.localPlayers.length) ? this.localPlayers : (this.players || []); },
    cTrick(){ return (this.localTrickCards && this.localTrickCards.length) ? this.localTrickCards : (this.trickCards || []); },
    cTrump(){ return this.localTrumpCard || this.trumpCard || null; },
    meIdx(){
      try {
        const path = this.path || '';
        if (path.startsWith('/play/')) {
          const name = decodeURIComponent(path.substring('/play/'.length));
          const idx = (this.cPlayers || []).findIndex(p => p && p.name === name);
          if (idx >= 0) return idx;
        }
        const url = new URL(window.location.href);
        const q = url.searchParams.get('pIdx');
        const i = q != null ? parseInt(q, 10) : 0;
        return isNaN(i) ? 0 : i;
      } catch { return 0; }
    },
    me(){
      const i = this.meIdx;
      return (this.cPlayers && this.cPlayers[i]) || null;
    },
    meCards(){
      // For /play/:name we receive a flat array of cards in handCards
      return Array.isArray(this.localHandCards) && this.localHandCards.length ? this.localHandCards : [];
    },
    trumpLabel(){
      const c = this.cTrump;
      if (!c) return '—';
      const v = c?.value?.name || c?.value || '';
      if (/Wizard/i.test(v)) return 'Wizard';
      if (/Jester|Chester/i.test(v)) return 'Jester';
      return String(c?.color || '').toString();
    },
    isBidPhase(){
      const k = (this.localCurrentPromptKind || '').toLowerCase();
      return k === 'bid';
    },
    bgStyle(){
      try {
        const theme = (document.cookie.match(/(?:^|; )theme=([^;]+)/) || [,'dark'])[1];
        const isLight = theme === 'light';
        const light = new URL('../../../public/images/backgrounds/Wizard_game_background_light.png', import.meta.url).href;
        const dark = new URL('../../../public/images/backgrounds/Wizard_game_background2_GUI.png', import.meta.url).href;
        return `url('${isLight ? light : dark}')`;
      } catch(_) { return ''; }
    }
  },
  methods: {
    isBidTurnFor(name){
      try {
        if (!name) return false;
        if (!this.isBidPhase) return false;
        return (this.localCurrentPromptPlayer || '') === name;
      } catch(_) { return false; }
    },
    isCardTurnFor(name){
      try {
        if (!name) return false;
        const k = (this.localCurrentPromptKind || '').toLowerCase();
        if (k !== 'card') return false;
        return (this.localCurrentPromptPlayer || '') === name;
      } catch(_) { return false; }
    },
    handForIndex(i){
      try {
        if (!Array.isArray(this.localHands)) return [];
        const h = this.localHands[i];
        return Array.isArray(h) ? h : [];
      } catch(_) { return []; }
    },
    cardToFile(card){
      try {
        const value = card?.value?.name || card?.value;
        if (/Wizard/i.test(value)) return 'Wizard.png';
        if (/Jester|Chester/i.test(value)) return 'Jester.png';
        const color = (card?.color || '').toString();
        const n = card?.number ?? (typeof card?.cardType === 'function' ? card.cardType() : card?.value?.cardType?.());
        const num = (n != null) ? n : (card?.valueNumber != null ? card.valueNumber : '');
        return `${color}_${num}.png`;
      } catch(_) { return 'Jester.png'; }
    },
    cardImg(card){
      try {
        if (card && card.imageUrl) return card.imageUrl;
        return new URL(`../../../public/images/cards/${this.cardToFile(card)}`, import.meta.url).href;
      } catch(_) { return ''; }
    },
    cardText(card){
      try {
        const color = card?.color || '';
        const value = card?.value?.name || card?.value || '';
        return `${value} ${color}`.trim();
      } catch(_) { return ''; }
    },
    async fetchGameState(){
      try {
        let url = '/api/gameState';
        try {
          // If we are on /play/:name, tell the API for whom we want the flat handCards
          if (this.path && this.path.startsWith('/play/')) {
            const rawName = this.path.substring('/play/'.length);
            const name = encodeURIComponent(decodeURIComponent(rawName));
            const qs = new URLSearchParams(window.location.search || '');
            if (!qs.has('player')) qs.set('player', name);
            url += '?' + qs.toString();
          } else {
            url += (window.location.search || '');
          }
        } catch(_) {
          url += (window.location.search || '');
        }
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          this.localPlayers = Array.isArray(data.players) ? data.players : [];
          this.localTrickCards = Array.isArray(data.trickCards) ? data.trickCards : [];
          this.localTrumpCard = data.trumpCard || null;
          this.localHands = Array.isArray(data.hands) ? data.hands : [];
          this.localHandCards = Array.isArray(data.handCards) ? data.handCards : [];
          this.round = Number(data.round || 0);
          this.localCurrentPromptPlayer = data.currentPromptPlayer || '';
          this.localCurrentPromptKind = data.currentPromptKind || '';
          // reset bid error when prompt changes
          this.bidError = '';
          // Update scoreboard component
          try {
            const el = document.getElementById('ingame-score');
            const scores = (this.cPlayers || []).map(p => {
              const rb = p?.roundBids;
              const bid = Array.isArray(rb) ? Number(rb[rb.length - 1] || 0) : Number(rb || 0);
              return { name: p?.name || '', bid, points: Number(p?.points || 0) };
            });
            const apply = () => { try { if (el) el.scores = scores; } catch(_){} };
            if (window.customElements?.whenDefined) {
              if (customElements.get('wizard-score')) apply(); else customElements.whenDefined('wizard-score').then(apply).catch(apply);
            } else apply();
          } catch(_) {}
        }
      } catch(_) { /* ignore */ }
    },
    async submitBid(playerName){
      try {
        this.bidError = '';
        if (!this.isBidTurnFor(playerName)) return;
        const max = this.isIngamePath
          ? (this.cPlayers && this.cPlayers.length ? (this.handForIndex(this.cPlayers.findIndex(p=>p && p.name===playerName)).length || 0) : 0)
          : (this.meCards.length || 0);
        const n = Number(this.bidValue);
        if (!Number.isFinite(n) || n < 0 || n > max) {
          this.bidError = `Bitte Zahl zwischen 0 und ${max} eingeben.`;
          return;
        }
        const body = JSON.stringify({ bid: n, player: playerName });
        const res = await fetch('/api/bid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (!res.ok) {
          let msg = '';
          try { const j = await res.json(); msg = j?.error || ''; } catch(_) {}
          this.bidError = msg || 'Fehler beim Senden der Ansage.';
          return;
        }
        // clear value and refresh
        this.bidValue = 0;
        await this.fetchGameState();
      } catch(e){
        this.bidError = 'Netzwerkfehler bei der Ansage.';
      }
    },
    async maybePlay(playerName, cardId){
      try {
        if (!this.isCardTurnFor(playerName)) return;
        await this.playCard(playerName, cardId);
      } catch(_) {}
    },
    async playCard(playerName, cardId){
      try {
        const body = JSON.stringify({ cardId, player: playerName });
        const res = await fetch('/api/playCard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (!res.ok) {
          let msg = '';
          try { const j = await res.json(); msg = j?.error || ''; } catch(_) {}
          if (msg) { try { window.toastr?.error(msg); } catch(_) {} }
          return;
        }
        await this.fetchGameState();
      } catch(e){
        try { window.toastr?.error('Karte konnte nicht gespielt werden.'); } catch(_) {}
      }
    }
  },
  mounted(){
    // Initial fetch and polling for game state
    this.fetchGameState();
    try { this.pollId = window.setInterval(() => this.fetchGameState(), 1500); } catch(_) {}

    // Load legacy scripts required by the page
    try {
      const webc = new URL('../../../public/javascripts/webcomponents.js', import.meta.url).href;
      import(/* @vite-ignore */ webc).catch(() => {});
    } catch(_) {}
    try {
      const socket = new URL('../../../public/javascripts/socketClient.js', import.meta.url).href;
      import(/* @vite-ignore */ socket).catch(() => {});
    } catch(_) {}

    // CDN modules that were previously included
    try {
      // Shoelace CSS
      if (!document.querySelector('link[data-ingame-shoelace]')){
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/themes/light.css';
        link.setAttribute('data-ingame-shoelace','1');
        document.head.appendChild(link);
      }
      // Shoelace JS
      if (!document.querySelector('script[data-ingame-shoelace]')){
        const s = document.createElement('script');
        s.type = 'module';
        s.src = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/shoelace.js';
        s.setAttribute('data-ingame-shoelace','1');
        document.head.appendChild(s);
      }
      // Clipboard copy web component
      if (!document.querySelector('script[data-ingame-clipboard]')){
        const s2 = document.createElement('script');
        s2.type = 'module';
        s2.src = 'https://unpkg.com/@github/clipboard-copy-element@latest/dist/index.js';
        s2.setAttribute('data-ingame-clipboard','1');
        document.head.appendChild(s2);
      }
      // Ionicons
      if (!document.querySelector('script[data-ingame-ionicons-esm]')){
        const s3 = document.createElement('script');
        s3.type = 'module';
        s3.src = 'https://unpkg.com/ionicons@7/dist/ionicons/ionicons.esm.js';
        s3.setAttribute('data-ingame-ionicons-esm','1');
        document.head.appendChild(s3);
      }
      if (!document.querySelector('script[data-ingame-ionicons-nm]')){
        const s4 = document.createElement('script');
        s4.noModule = true;
        s4.src = 'https://unpkg.com/ionicons@7/dist/ionicons/ionicons.js';
        s4.setAttribute('data-ingame-ionicons-nm','1');
        document.body.appendChild(s4);
      }
    } catch(_) {}
  },
  unmounted(){ try { if (this.pollId) clearInterval(this.pollId); } catch(_) {} }
}
</script>

<style scoped>
.ingrid { max-width: 1200px; margin: 0 auto; padding: 0 12px; }
.ingrid-row { display: flex; flex-wrap: nowrap; gap: 12px; }
.ingrid-col { flex: 0 0 auto; min-width: 0; }
.ingrid-col--left { flex-basis: 24%; }
.ingrid-col--center { flex-basis: 52%; }
.ingrid-col--right { flex-basis: 24%; }
.inline-center { display: inline-flex; align-items: center; gap: .5rem; }
.pad-1 { padding: .5rem; }
.gap-2 { gap: .5rem; }
.hand-cards { display:flex; gap:.5rem; padding:.5rem; }
.img-fluid { max-width: 100%; height: auto; }

/* Bid input/button styling */
.bid-box { display: inline-flex; align-items: center; gap: .5rem; }
.bid-input { width: 5.5rem; padding: .35rem .5rem; border-radius: .375rem; border: 1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.15); color: inherit; }
.bid-submit { padding: .4rem .75rem; border-radius: .375rem; border: 1px solid transparent; background: rgba(255,255,255,.2); color: #fff; cursor: pointer; transition: background .15s ease-in-out, filter .15s; }
.bid-submit:hover { filter: brightness(1.05); }
.bid-submit:active { filter: brightness(0.95); }

/* Clickable cards when it's the player's turn to play a card */
.card-img.clickable { cursor: pointer; box-shadow: 0 0 0 2px rgba(255,255,255,.0); transition: transform .12s ease, box-shadow .12s ease; }
.card-img.clickable:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 4px 18px rgba(0,0,0,.35); }
</style>

<!-- Non-scoped styles to adapt to the global dark theme class on MainPage -->
<style>
/* Dark mode: make the OK button clearly darker, as requested */
.theme-dark .bid-submit { background: rgba(0,0,0,.55) !important; color: #f0f0f0 !important; border-color: rgba(255,255,255,.12) !important; }
.theme-dark .bid-submit:hover { background: rgba(0,0,0,.65) !important; }
.theme-dark .bid-submit:active { background: rgba(0,0,0,.75) !important; }

/* Light theme keeps a lighter button */
.theme-light .bid-submit { background: rgba(0,0,0,.08); color: #111; border-color: rgba(0,0,0,.12); }
.theme-light .bid-submit:hover { background: rgba(0,0,0,.12); }
.theme-light .bid-submit:active { background: rgba(0,0,0,.16); }
</style>
