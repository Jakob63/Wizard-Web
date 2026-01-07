<template>
  <main>
    <div class="game__main bg-ingame" :style="{ backgroundImage: bgStyle }">

      <!-- Top Row: Trump / Current Trick / Scoreboard -->
      <div class="ingrid">
        <div class="ingrid-row">
          <!-- Trump -->
          <div class="ingrid-col ingrid-col--left">
            <section class="game__section game__section--trump" aria-label="Trump">
              <div class="title">Trump: {{ trumpLabel }}</div>
              <div v-if="cTrump">
                <img class="img-fluid" loading="lazy" :src="cardImg(cTrump)" :alt="cardText(cTrump)" />
              </div>
            </section>
          </div>

          <!-- Current Trick -->
          <div class="ingrid-col ingrid-col--center">
            <section class="game__section" aria-label="Current Trick">
              <div class="title">Current Trick:</div>
              <div style="display:flex" v-if="cTrick.length">
                <div class="card" v-for="(card, i) in cTrick" :key="'trick-'+i">
                  <img class="img-fluid" loading="lazy" :src="cardImg(card)" :alt="cardText(card)" />
                </div>
              </div>
            </section>
          </div>

          <!-- Scoreboard -->
          <div class="ingrid-col ingrid-col--right">
            <section class="game__section game__section--scoreboard" aria-label="Scoreboard">
              <div class="title">Scoreboard</div>
              <WizardScore :scores="scoreRows" :no-title="true" />
            </section>
          </div>
        </div>
      </div>

      <!-- Player Hands -->
      <div id="ingame-vue-root" class="ingrid">
        <div class="ingrid-row pad-1" v-if="cPlayers.length">
          <section class="game__section" aria-label="Players overview">
            <div class="title">Players:</div>
            <div>{{ cPlayers.map(p => p.name).join(', ') }}</div>
          </section>
        </div>

        <template v-for="(p, pIdx) in cPlayers" :key="'hand-'+pIdx">
          <div class="ingrid-row pad-1">
            <section class="game__section game__hand" :aria-label="'Hand of ' + p.name">
              <div class="inline-center pad-1">
                <div class="player-name">{{ p.name }}</div>

                <!-- Bid input -->
                <div v-if="isBidTurnFor(p.name)" class="bid-box">
                  <label class="visually-hidden" :for="'bid-' + pIdx">
                    Ansage für {{ p.name }}
                  </label>
                  <input type="number"
                         class="bid-input"
                         :id="'bid-' + pIdx"
                         :placeholder="'Bid (0–' + (handForIndex(pIdx).length || 0) + ') '"
                         :max="handForIndex(pIdx).length || 0"
                         min="0"
                         v-model.number="bids[p.name]"
                         @keyup.enter.prevent="submitBid(p.name)">
                  <button type="button" class="bid-submit" @click="submitBid(p.name)">OK</button>
                  <span class="text-danger" v-if="bidErrors[p.name]">{{ bidErrors[p.name] }}</span>
                </div>
              </div>

              <!-- Player Cards -->
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
      </div>
    </div>
  </main>
</template>

<script>
import { BACKEND } from '../api/client.js';
import WizardScore from './WizardScore.vue';

export default {
  name: 'IngamePage',
  components: { WizardScore },
  props: {
    players: { type: Array, default: () => (window.INGAME_DATA?.players || []) },
    trumpCard: { type: Object, default: () => (window.INGAME_DATA?.trumpCard || null) },
    trickCards: { type: Array, default: () => (window.INGAME_DATA?.trickCards || []) }
  },
  data() {
    return {
      localPlayers: [],
      localTrumpCard: null,
      localTrickCards: [],
      localHands: [],
      localHandCards: [],
      localCurrentPromptPlayer: '',
      localCurrentPromptKind: '',
      bids: {},          // 🟢 Individuelle Bids pro Spieler
      bidErrors: {},     // 🟢 Fehler pro Spieler
      scoreRows: [],
      pollId: null
    };
  },
  computed: {
    cPlayers() { return this.localPlayers.length ? this.localPlayers : this.players; },
    cTrick() { return this.localTrickCards.length ? this.localTrickCards : this.trickCards; },
    cTrump() { return this.localTrumpCard || this.trumpCard || null; },
    isBidPhase() { return (this.localCurrentPromptKind || '').toLowerCase() === 'bid'; },
    trumpLabel() {
      const c = this.cTrump;
      if (!c) return '—';
      const v = c?.value?.name || c?.value || '';
      if (/Wizard/i.test(v)) return 'Wizard';
      if (/Jester|Chester/i.test(v)) return 'Jester';
      return String(c?.color || '');
    },
    bgStyle() {
      try {
        const theme = (document.cookie.match(/(?:^|; )theme=([^;]+)/) || [,'dark'])[1];
        const isLight = theme === 'light';
        const light = new URL('../../../public/images/backgrounds/Wizard_game_background_light.png', import.meta.url).href;
        const dark = new URL('../../../public/images/backgrounds/Wizard_game_background2_GUI.png', import.meta.url).href;
        return `url('${isLight ? light : dark}')`;
      } catch (e) { console.error(e); return ''; }
    }
  },
  methods: {
    handForIndex(i) { return Array.isArray(this.localHands[i]) ? this.localHands[i] : []; },
    isBidTurnFor(name) { return this.isBidPhase && this.localCurrentPromptPlayer === name; },
    isCardTurnFor(name) { return (this.localCurrentPromptKind || '').toLowerCase() === 'card' && this.localCurrentPromptPlayer === name; },
    cardToFile(card) {
      try {
        const value = card?.value?.name || card?.value;
        if (/Wizard/i.test(value)) return 'Wizard.png';
        if (/Jester|Chester/i.test(value)) return 'Jester.png';
        const color = card?.color || '';
        const num = card?.number ?? card?.valueNumber ?? '';
        return `${color}_${num}.png`;
      } catch { return 'Jester.png'; }
    },
    cardImg(card) {
      try {
        if (!card) return '';
        if (card.imageUrl) return card.imageUrl;
        if (typeof card === 'string') return card.startsWith('/') ? BACKEND + card : card;
        return new URL(`../../../public/images/cards/${this.cardToFile(card)}`, import.meta.url).href;
      } catch (e) { console.error(e); return ''; }
    },
    cardText(card) {
      const color = card?.color || '';
      const value = card?.value?.name || card?.value || '';
      return `${value} ${color}`.trim();
    },
    async fetchGameState() {
      try {
        let url = '/pwa/api/gameState' + window.location.search;
        const res = await fetch(`${BACKEND}${url}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        this.localPlayers = Array.isArray(data.players) ? data.players : [];
        this.localTrickCards = Array.isArray(data.trickCards) ? data.trickCards : [];
        this.localTrumpCard = data.trumpCard || null;
        this.localHands = Array.isArray(data.hands) ? data.hands : [];
        this.localHandCards = Array.isArray(data.handCards) ? data.handCards : [];
        this.localCurrentPromptPlayer = data.currentPromptPlayer || '';
        this.localCurrentPromptKind = data.currentPromptKind || '';
        this.bidErrors = {};
        this.scoreRows = this.cPlayers.map(p => ({
          name: p.name,
          bid: Array.isArray(p.roundBids) ? Number(p.roundBids.at(-1)||0) : Number(p.roundBids||0),
          points: Number(p.points||0)
        }));
      } catch(e) { console.error('fetchGameState error', e); }
    },
    async submitBid(playerName) {
      try {
        if (!this.isBidTurnFor(playerName)) return;
        const max = this.handForIndex(this.cPlayers.findIndex(p => p.name === playerName)).length || 0;
        const n = Number(this.bids[playerName] || 0);
        if (!Number.isFinite(n) || n < 0 || n > max) {
          this.bidErrors[playerName] = `Bitte Zahl zwischen 0 und ${max} eingeben.`;
          return;
        }

        const res = await fetch(`${BACKEND}/pwa/api/bid`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bid: n, player: playerName })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          this.bidErrors[playerName] = err?.error || 'Fehler beim Senden der Ansage.';
          return;
        }
        this.bids[playerName] = 0;
        await this.fetchGameState();
      } catch(e) { console.error(e); this.bidErrors[playerName] = 'Netzwerkfehler bei der Ansage.'; }
    },
    async maybePlay(playerName, cardId) {
      if (!this.isCardTurnFor(playerName)) return;
      try {
        const res = await fetch(`${BACKEND}/pwa/api/playCard`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId, player: playerName })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(err?.error || 'Karte konnte nicht gespielt werden.');
        }
        await this.fetchGameState();
      } catch(e) { console.error('playCard error', e); }
    }
  },
  mounted() {
    this.fetchGameState();
    this.pollId = setInterval(this.fetchGameState, 1500);
  },
  unmounted() {
    if (this.pollId) clearInterval(this.pollId);
  }
};
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
.hand-cards { display:flex; gap:.5rem; padding:.5rem; }
.img-fluid { max-width: 100%; height: auto; }

.bid-box { display: inline-flex; align-items: center; gap: .5rem; }
.bid-input { width: 5.5rem; padding: .35rem .5rem; border-radius: .375rem; border: 1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.15); color: inherit; }
.bid-submit { padding: .4rem .75rem; border-radius: .375rem; border: 1px solid transparent; background: rgba(255,255,255,.2); color: #fff; cursor: pointer; transition: background .15s ease-in-out, filter .15s; }
.bid-submit:hover { filter: brightness(1.05); }
.bid-submit:active { filter: brightness(0.95); }

.card-img.clickable { cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
.card-img.clickable:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 4px 18px rgba(0,0,0,.35); }
</style>
