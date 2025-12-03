(function(){
  if (!window.Vue) {
    console.warn('Vue not found. The page will fall back to legacy DOM updates.');
    return;
  }
  const App = {
    name: 'RootApp',
    data(){
      return {
        lastText: 'Ready…',
        log: [],
        bids: {},
        filter: '',
        helpOpen: false,
        game: {
          started: false,
          round: null,
          trump: null,
          trick: [],
          players: [],
          myHand: []
        }
      };
    },
    computed: {
      roundLabel(){
        return (this.game && this.game.round != null) ? ('Runde ' + this.game.round) : 'Runde: —';
      },
      trickCount(){
        return Array.isArray(this.game && this.game.trick) ? this.game.trick.length : 0;
      },
      playersCount(){
        return Array.isArray(this.game && this.game.players) ? this.game.players.length : 0;
      },
      filteredLog(){
        const q = (this.filter || '').toString().trim().toLowerCase();
        if (!q) return this.log;
        try {
          return this.log.filter(function (l){ return String(l||'').toLowerCase().includes(q); });
        } catch(_) {
          return this.log;
        }
      }
    },
    methods: {
      burstRefresh(labelForSection, playerName){
        const calls = [0, 120, 300, 600];
        calls.forEach((ms) => {
          setTimeout(() => {
            try { if (typeof window.refreshGameState === 'function') { window.refreshGameState(); } } catch(_) {}
            if (labelForSection) this.refreshSectionByAria(labelForSection);
            if (playerName) this.refreshHandOf(playerName);
          }, ms);
        });
      },
      async refreshSectionByAria(label, { retries = 2, delay = 120 } = {}){
        const tryOnce = async () => {
          const url = window.location.href + (window.location.href.includes('?') ? '&' : '?') + '_ts=' + Date.now();
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return false;
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const fresh = doc.querySelector(`section[aria-label="${label}"]`);
          const current = document.querySelector(`section[aria-label="${label}"]`);
          if (fresh && current && current.parentElement) {
            current.parentElement.replaceChild(fresh, current);
            return true;
          }
          return false;
        };
        try {
          for (let i = 0; i <= retries; i++) {
            const ok = await tryOnce();
            if (ok) return;
            await new Promise(r => setTimeout(r, delay * (i + 1)));
          }
        } catch (e) {
          console.warn('refreshSectionByAria failed for', label, e);
        }
      },
      async refreshHandOf(playerName, { retries = 2, delay = 120 } = {}){
        if (!playerName) return;
        const label = `Hand of ${playerName}`;
        const tryOnce = async () => {
          const url = window.location.href + (window.location.href.includes('?') ? '&' : '?') + '_ts=' + Date.now();
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return false;
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const fresh = doc.querySelector(`section[aria-label="${label}"]`);
          const current = document.querySelector(`section[aria-label="${label}"]`);
          if (fresh && current && current.parentElement) {
            current.parentElement.replaceChild(fresh, current);
            return true;
          }
          return false;
        };
        try {
          for (let i = 0; i <= retries; i++) {
            const ok = await tryOnce();
            if (ok) return;
            await new Promise(r => setTimeout(r, delay * (i + 1)));
          }
        } catch(e) {
          console.warn('refreshHandOf failed for', playerName, e);
        }
      },
      setText(text){
        this.lastText = String(text);
        this.log.unshift(this.lastText);
        if (this.log.length > 100) this.log.length = 100;
        try {
          const area = document.getElementById('gameArea');
          if (area) area.textContent = this.lastText;
        } catch(_) {}
      },
      append(html){
        const tmp = document.createElement('div');
        tmp.innerHTML = String(html);
        const text = tmp.textContent || tmp.innerText || '';
        this.setText(text);
        try {
          const area = document.getElementById('gameArea');
          if (area) area.innerHTML = String(html);
        } catch(_) {}
      },
      onEvent(msg){
        try {
          const ev = msg && msg.event;
          const data = (msg && msg.data) || {};
          switch (ev) {
            case 'game.started':
              this.game.started = true;
              this.setText('Game started');
              break;
            case 'round.started':
              this.game.round = data.round ?? this.game.round;
              this.setText('Round started: ' + (this.game.round ?? '?'));
              // Neuer Trick
              this.game.trick = [];
              this.burstRefresh('Current Trick');
              break;
            case 'trump.card':
              this.game.trump = { color: data.color ?? '?', value: data.value ?? '?' };
              this.setText('Trump card: ' + this.game.trump.color + ' ' + this.game.trump.value);
              break;
            case 'trick.card.played': {
                const entry = { player: data.player, color: data.color ?? '?', value: data.value ?? (data.card && data.card.value) ?? '?' };
                if (!entry.color && data.card && data.card.color) entry.color = data.card.color;
                this.game.trick = [...this.game.trick, entry].slice(-10);
                this.setText((entry.player ? (entry.player + ' plays ') : 'Card in trick: ') + entry.color + ' ' + entry.value);
                this.burstRefresh('Current Trick', entry.player);
                break;
              }
            case 'player.play.card': {
                const player = data.player || data.name;
                const value = data.value || (data.card && data.card.value) || '?';
                const color = data.color || (data.card && data.card.color) || '?';
                this.setText((player ? (player + ' plays ') : 'Card played: ') + color + ' ' + value);
                this.burstRefresh('Current Trick', player);
                break;
              }
            case 'round.finished':
              this.setText('Round finished: ' + (data.round ?? this.game.round ?? '?'));
              break;
            case 'players.hands.updated':
                if (Array.isArray(data.players)) {
                    this.game.players = data.players.map(p => ({
                        name: p.name,
                        points: p.points,
                        roundBids: p.roundBids
                    }));
                }
                this.setText('Players hands updated');
                this.burstRefresh('Current Trick');
                try {
                    const sections = Array.from(document.querySelectorAll('section[aria-label^="Hand of "]'));
                    const names = sections.map(s => (s.getAttribute('aria-label')||'').replace('Hand of ','')).filter(Boolean);
                    (async () => {
                        for (const n of names) {
                            await this.refreshHandOf(n, { retries: 2, delay: 120 });
                        }
                    })();
                    this.refreshSectionByAria('Current Trick');
                } catch(_) {}
                break;
            case 'player.names.prompt':
              this.setText('Please enter player names (' + (data.current ?? 0) + '/' + (data.total ?? 0) + ')');
              break;
            case 'player.hand':
              if (Array.isArray(data.cards)) {
                this.game.myHand = data.cards.map(c => ({ color: c.color, value: c.value }));
                this.setText('Hand of ' + (data.player ?? 'Player'));
              }
              break;
            default:
              if (typeof ev === 'string' && ev.endsWith('.accepted')) {
                this.setText(ev + ': ' + (data && (data.value ?? data.message ?? '')));
              } else if (typeof ev === 'string' && ev.endsWith('.rejected')) {
                this.setText(ev + ': ' + (data && (data.reason ?? 'rejected')));
              }
          }
        } catch (e) {
          console.error('onEvent error', e);
        }
      }
    },
    watch: {
      'game.round': function(newVal, oldVal){
        if (newVal !== oldVal) {
          try { this.log.unshift('Neue Runde: ' + newVal); } catch(_) {}
        }
      }
    },
    template: `<div style="display:none"></div>`,
    mounted(){
      window.gameUI = {
        setText: (t) => this.setText(t),
        append: (h) => this.append(h),
        onEvent: (m) => this.onEvent(m)
      };

      try {
        const enhanceRoot = document.getElementById('ingame-vue-root');
        if (enhanceRoot && window.Vue && typeof Vue.createApp === 'function') {
          const Enhance = {
            name: 'EnhanceExistingUI',
            data: () => ({
              bids: {}
            }),
            methods: {
              submitBid(idx){
                try {
                  const btn = document.querySelector('.js-bid-submit[data-index="' + idx + '"]');
                  if (btn) {
                    const input = document.getElementById('bid-' + idx);
                    if (input && Object.prototype.hasOwnProperty.call(this.bids, idx)) {
                      input.value = this.bids[idx];
                    }
                    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                  }
                } catch(e) { console.warn('submitBid failed', e); }
              }
            },
            mounted(){
              try {
                const inputs = enhanceRoot.querySelectorAll('input.bid-input[id^="bid-"]');
                inputs.forEach((inp) => {
                  const id = inp.id && inp.id.startsWith('bid-') ? inp.id.substring(4) : null;
                  if (id != null) this.$data.bids[id] = inp.value || '';
                });
              } catch(_) {}
            }
          };
          try {
            Vue.createApp(Enhance).mount('#ingame-vue-root');
          } catch(e) {
            console.warn('Mount enhance app failed', e);
          }
        }
      } catch(e) { console.warn('Enhancement setup failed', e); }
    }
  };

  try { Vue.createApp(App).mount('#app'); } catch(e) { console.warn('Mount root app failed', e); }
})();
