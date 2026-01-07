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
                <img
                    class="img-fluid"
                    loading="lazy"
                    :src="cardImg(cTrump)"
                    :alt="cardText(cTrump)"
                />
              </div>
            </section>
          </div>

          <!-- Current Trick -->
          <div class="ingrid-col ingrid-col--center">
            <section class="game__section" aria-label="Current Trick">
              <div class="title">Current Trick:</div>
              <div style="display:flex" v-if="cTrick.length">
                <div class="card" v-for="(card, i) in cTrick" :key="'trick-'+i">
                  <img
                      class="img-fluid"
                      loading="lazy"
                      :src="cardImg(card)"
                      :alt="cardText(card)"
                  />
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
                  <input
                      type="number"
                      class="bid-input"
                      :id="'bid-' + pIdx"
                      :placeholder="'Bid (0–' + (handForIndex(pIdx).length || 0) + ') '"
                      :max="handForIndex(pIdx).length || 0"
                      min="0"
                      v-model.number="bids[p.name]"
                      @keyup.enter.prevent="submitBid(p.name)"
                  />
                  <button type="button" class="bid-submit" @click="submitBid(p.name)">OK</button>
                  <span class="text-danger" v-if="bidErrors[p.name]">
                    {{ bidErrors[p.name] }}
                  </span>
                </div>
              </div>

              <!-- Player Cards -->
              <div class="hand-cards">
                <div class="md-3" v-for="(card, idx) in handForIndex(pIdx)" :key="'c-'+idx">
                  <div class="card-slot">
                    <img
                        class="img-fluid card-img"
                        :class="{ clickable: isCardTurnFor(p.name) }"
                        :data-card-id="idx + 1"
                        :title="cardText(card)"
                        :src="cardImg(card)"
                        alt=""
                        @click="maybePlay(p.name, idx + 1)"
                    />
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
import { apiGet, apiPost } from '../api/client.js';
import WizardScore from './WizardScore.vue';

export default {
  name: 'IngamePage',
  components: { WizardScore },

  props: {
    players: { type: Array, default: () => window.INGAME_DATA?.players || [] },
    trumpCard: { type: Object, default: () => window.INGAME_DATA?.trumpCard || null },
    trickCards: { type: Array, default: () => window.INGAME_DATA?.trickCards || [] }
  },

  data() {
    return {
      localPlayers: [],
      localTrumpCard: null,
      localTrickCards: [],
      localHands: [],
      localCurrentPromptPlayer: '',
      localCurrentPromptKind: '',
      bids: {},
      bidErrors: {},
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
      const v = this.cTrump?.value?.name || this.cTrump?.value || '';
      if (/Wizard/i.test(v)) return 'Wizard';
      if (/Jester|Chester/i.test(v)) return 'Jester';
      return this.cTrump?.color || '—';
    },

    bgStyle() {
      try {
        const theme = (document.cookie.match(/theme=([^;]+)/) || [,'dark'])[1];
        const img = theme === 'light'
            ? 'Wizard_game_background_light.png'
            : 'Wizard_game_background2_GUI.png';
        return `url('${new URL(`../../../public/images/backgrounds/${img}`, import.meta.url).href}')`;
      } catch {
        return '';
      }
    }
  },

  methods: {
    handForIndex(i) { return Array.isArray(this.localHands[i]) ? this.localHands[i] : []; },
    isBidTurnFor(name) { return this.isBidPhase && this.localCurrentPromptPlayer === name; },
    isCardTurnFor(name) {
      return this.localCurrentPromptKind === 'card'
          && this.localCurrentPromptPlayer === name;
    },

    cardToFile(card) {
      const v = card?.value?.name || card?.value || '';
      if (/Wizard/i.test(v)) return 'Wizard.png';
      if (/Jester|Chester/i.test(v)) return 'Jester.png';
      return `${card?.color}_${card?.number}.png`;
    },

    cardImg(card) {
      if (!card) return '';
      if (card.imageUrl) return card.imageUrl;
      if (typeof card === 'string') return card.startsWith('/') ? BACKEND + card : card;
      return new URL(`../../../public/images/cards/${this.cardToFile(card)}`, import.meta.url).href;
    },

    cardText(card) {
      return `${card?.value?.name || card?.value || ''} ${card?.color || ''}`.trim();
    },

    async fetchGameState() {
      try {
        const data = await apiGet(`/pwa/api/gameState${window.location.search}`);
        this.localPlayers = data.players || [];
        this.localTrickCards = data.trickCards || [];
        this.localTrumpCard = data.trumpCard || null;
        this.localHands = data.hands || [];
        this.localCurrentPromptPlayer = data.currentPromptPlayer || '';
        this.localCurrentPromptKind = data.currentPromptKind || '';

        this.scoreRows = this.localPlayers.map(p => ({
          name: p.name,
          bid: Number(p.roundBids?.at(-1) || 0),
          points: Number(p.points || 0)
        }));
      } catch (e) {
        // ignore errors during poll
      }
    },

    async submitBid(player) {
      if (!this.isBidTurnFor(player)) return;
      try {
        await apiPost('/pwa/api/bid', { player, bid: Number(this.bids[player] || 0) });
        this.fetchGameState();
      } catch (e) {
        console.error('Bid failed', e);
      }
    },

    async maybePlay(player, cardId) {
      if (!this.isCardTurnFor(player)) return;
      try {
        await apiPost('/pwa/api/playCard', { player, cardId });
        this.fetchGameState();
      } catch (e) {
        console.error('Play card failed', e);
      }
    }
  },

  mounted() {
    this.fetchGameState();
    this.pollId = setInterval(this.fetchGameState, 1500);
  },

  beforeUnmount() {
    if (this.pollId) clearInterval(this.pollId);
  }
};
</script>
