// webcomponents.js
// Native Custom Elements used in the project without build tooling

(function(){
    // Utility: create element with Shadow DOM and style
    function attachTemplate(el, tpl){
        const root = el.attachShadow({ mode: 'open' });
        root.appendChild(tpl.content.cloneNode(true));
        return root;
    }

    // <wizard-score> — simple scoreboard component
    class WizardScore extends HTMLElement {
        constructor(){
            super();
            this._scores = [];
            this._tpl = document.createElement('template');
            this._tpl.innerHTML = `
        <style>
          :host{ font-family: system-ui, Arial, sans-serif; display:block; }
          /* integrate into existing UI without extra card chrome */
          .card{ border:0; border-radius:0; padding:0; background:transparent; }
          .title{ font-weight:600; margin-bottom:.5rem; }
          table{ width:100%; border-collapse: collapse; }
          th, td{ border-bottom:1px solid rgba(0,0,0,0.08); padding:6px 8px; text-align:left; }
          th{ background:transparent; font-weight:600; }
          tr:last-child td{ border-bottom:none; }
          /* dark mode tweak using bootstrap data attribute on <html> */
          :host-context(html[data-bs-theme="dark"]) th, :host-context(html[data-bs-theme="dark"]) td {
            border-bottom-color: rgba(255,255,255,0.12);
            color: var(--color-text, #e9eef6);
          }
          /* avatar + name inline layout */
          .player-cell{ display:inline-flex; align-items:center; gap:6px; }
          .player-cell vaadin-avatar{ --vaadin-avatar-size: 24px; }
          /* Local avatar badge (standard, no external dependency) */
          .player-cell .avatar-badge{
            display:inline-flex; align-items:center; justify-content:center;
            width:24px; height:24px; border-radius:50%;
            background:#eef; color:#345; font-weight:600; font-size:12px;
            border:1px solid rgba(0,0,0,0.08);
            box-sizing: border-box;
          }
          :host-context(html[data-bs-theme="dark"]) .player-cell .avatar-badge{
            background:#223; color:#cfe; border-color: rgba(255,255,255,0.12);
          }
          /* Make the player name act like a subtle link without adding UI chrome */
          .player-cell clipboard-copy { all: unset; display:inline; color: inherit; }
          .player-cell clipboard-copy:hover { text-decoration: underline; cursor: pointer; }
        </style>
        <div class="card">
          <div class="title" id="title">Scoreboard</div>
          <table>
            <thead>
              <tr><th>Player</th><th>Bid</th><th>Points</th></tr>
            </thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
      `;
            this._root = attachTemplate(this, this._tpl);
        }

        static get observedAttributes(){ return ['no-title']; }

        attributeChangedCallback(){ this.render(); }

        connectedCallback(){ this.render(); }

        set scores(val){
            if (!Array.isArray(val)) return;
            this._scores = val.map(x => ({ name: String(x.name||''), bid: Number(x.bid||0), points: Number(x.points||0) }));
            this.render();
        }
        get scores(){ return this._scores; }

        render(){
            const rows = this._root.getElementById('rows');
            if (!rows) return;
            // Handle optional no-title attribute
            try {
                const titleEl = this._root.getElementById('title');
                if (titleEl) {
                    titleEl.style.display = this.hasAttribute('no-title') ? 'none' : '';
                }
            } catch(_) {}
            rows.innerHTML = '';
            this._scores.forEach(s => {
                const tr = document.createElement('tr');
                const name = String(s.name || '');
                const parts = name.trim().split(/\s+/).filter(Boolean);
                const abbr = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || (name[0]||'?').toUpperCase();
                // Basic escaping for name text
                const escName = name.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
                const avatarHtml = `<span class="avatar-badge" title="${escName}">${abbr}</span>`;
                // Build share link for this player (no fallbacks; must work)
                const origin = window.location.origin;
                const shareUrl = origin + '/play/' + encodeURIComponent(name);
                const nameHtml = `<clipboard-copy value="${shareUrl}" aria-label="Copy share link for ${escName}" title="Copy link: ${shareUrl}"><span>${escName}</span></clipboard-copy>`;
                tr.innerHTML = `<td><span class="player-cell">${avatarHtml}${nameHtml}</span></td><td>${s.bid}</td><td>${s.points}</td>`;
                rows.appendChild(tr);
            });
        }
    }

    // <wizard-game> — small wrapper emitting events; could later host the full game
    class WizardGame extends HTMLElement {
        constructor(){
            super();
            this._tpl = document.createElement('template');
            this._tpl.innerHTML = `
        <style>
          :host{ display:block; font-family: system-ui, Arial, sans-serif; }
          .wrap{ border:1px dashed #bbb; border-radius:10px; padding:10px; background:#fcfcfc; }
          .row{ display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
          button{ padding:.4rem .7rem; border:1px solid #ccc; border-radius:6px; background:#f2f2f2; cursor:pointer; }
          .badge{ background:#eef; border:1px solid #ccd; padding:.1rem .4rem; border-radius:6px; }
        </style>
        <div class="wrap">
          <div class="row" style="justify-content:space-between">
            <div>Wizard Game (Custom Element)</div>
            <div class="badge" id="status">idle</div>
          </div>
          <div class="row" style="margin-top:.5rem;">
            <button id="start">Start</button>
            <button id="reset">Reset</button>
          </div>
        </div>
      `;
            this._root = attachTemplate(this, this._tpl);
        }

        connectedCallback(){
            const start = this._root.getElementById('start');
            const reset = this._root.getElementById('reset');
            const status = this._root.getElementById('status');
            if (start) start.addEventListener('click', () => {
                if (status) status.textContent = 'running';
                this.dispatchEvent(new CustomEvent('game-start', { bubbles: true }));
            });
            if (reset) reset.addEventListener('click', () => {
                if (status) status.textContent = 'idle';
                this.dispatchEvent(new CustomEvent('game-reset', { bubbles: true }));
            });
        }
    }

    try { customElements.define('wizard-score', WizardScore); } catch(_) {}
    try { customElements.define('wizard-game', WizardGame); } catch(_) {}
})();
