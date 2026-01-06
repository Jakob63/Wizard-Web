(function($) {
    if (window.__animatedHandsLoaded) {
        return;
    }
    window.__animatedHandsLoaded = true;
    const perCardDelay = 300;
    const betweenPlayersDelay = 420;
    const animationDuration = 320;
    const initialDelay = 420;

    (function injectAnimationCSS() {
        if (document.getElementById('animated-hands-style')) return;
        const css = `
.animate-hidden {
  transform: translateY(-24px) scale(0.98);
  opacity: 0;
  transition: transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease;
  will-change: transform, opacity;
}
.animate-visible {
  transform: translateY(0) scale(1);
  opacity: 1;
}
.game__section.trick-render-active .card-slot:not(#trick-render-root *),
.game__section.trick-render-active img.card-img:not(#trick-render-root img),
.game__section.trick-render-active img.img-fluid[data-card-id]:not(#trick-render-root img) {
  display: none !important;
}
.game__section.trick-render-active > :not(#trick-render-root),
#current_trick.trick-render-active > :not(#trick-render-root) {
  display: none !important;
}
.game__section.trick-render-hidden,
#current_trick.trick-render-hidden { display: none !important; }
`;
        const styleEl = document.createElement('style');
        styleEl.id = 'animated-hands-style';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    })();

    function setWizardScores(scores){
        try {
            if (typeof window.__updateWizardScores === 'function') {
                window.__updateWizardScores(scores);
                return;
            }
            const el = document.getElementById('ingame-score');
            if (!el) return;
            const assign = () => { try { el.scores = scores; } catch(_) {} };
            if (window.customElements && typeof customElements.whenDefined === 'function') {
                if (customElements.get('wizard-score')) assign();
                else {
                    try { customElements.whenDefined('wizard-score').then(assign).catch(assign); } catch(_) { assign(); }
                }
            } else {
                assign();
            }
        } catch(_) {}
    }

    function ajaxJson(route, options = {}) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: route.url,
                method: route.type,
                dataType: 'json',
                data: options.data,
                timeout: options.timeout ?? 15000,
                success: (data) => resolve(data),
                error: (jqXHR, status, error) => {
                    const err = new Error(error || status || 'AJAX Error');
                    err.status = jqXHR?.status;
                    err.responseJSON = jqXHR?.responseJSON;
                    err.responseText = jqXHR?.responseText;
                    reject(err);
                }
            });
        });
    }

    function renderHandCards($container, handCards) {
        const $holder = $container.find('.hand-cards');
        if ($holder.length === 0) return;

        $holder.empty();

        (handCards || []).forEach((c, idx) => {
            const label = c.label || ('Karte ' + (idx + 1));
            const $img = $('<img>', {
                class: 'img-fluid card-img animate-hidden',
                alt: '',
                title: label,
                src: c.imageUrl || ('/assets/images/cards/' + c.id + '.png'),
                'data-card-id': c.id
            });
            const $slot = $('<div>', { class: 'card-slot animate-hidden' }).append($img);
            $holder.append($slot);
        });
    }

    function applyHiddenState($allHands) {
        $allHands.find('.card-slot, img.card-img, img.img-fluid[data-card-id]').each(function () {
            $(this)
                .addClass('animate-hidden')
                .removeClass('animate-visible')
                .css('transition', `transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease`);
        });
    }

    function playStaggeredReveal($allHands) {
        let totalDelay = initialDelay;
        $allHands.each(function () {
            const $cards = $(this).find('.card-slot, img.card-img, img.img-fluid[data-card-id]');
            $cards.each(function (idx) {
                const $c = $(this);
                const showAt = totalDelay + idx * perCardDelay;
                setTimeout(() => {
                    $c.removeClass('animate-hidden').addClass('animate-visible');
                }, showAt);
            });
            totalDelay += $cards.length * perCardDelay + betweenPlayersDelay;
        });
    }

    async function initAnimatedHands() {
        const $hands = $('.game__hand');
        if ($hands.length === 0) return;

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            $hands.find('.card-slot, img.card-img, img.img-fluid[data-card-id]').removeClass('animate-hidden').addClass('animate-visible');
            return;
        }

        const hasRoute = !!(window.jsRoutes && jsRoutes.controllers && jsRoutes.controllers.HomeController && jsRoutes.controllers.HomeController.gameState);
        if (!hasRoute) {
            applyHiddenState($hands);
            playStaggeredReveal($hands);
            return;
        }

        const route = jsRoutes.controllers.HomeController.gameState();

        try {
            const player = (typeof currentPlayerFromPath === 'function') ? currentPlayerFromPath() : (function(){
                try {
                    const path = window.location && window.location.pathname || '';
                    if (path.startsWith('/play/')) return decodeURIComponent(path.substring('/play/'.length));
                } catch(_) {}
                return undefined;
            })();
            const state = await ajaxJson(route, { data: player ? { player } : undefined });
            const $hands = $('.game__hand');
            if (Array.isArray(state?.hands) && state.hands.length > 0) {
                $hands.each(function(i){
                    renderHandCards($(this), state.hands[i] || []);
                });
            } else {
                const $mainHand = $hands.first();
                renderHandCards($mainHand, state?.handCards || []);
            }
            applyHiddenState($hands);
            playStaggeredReveal($hands);
            updateScoreboard(state);
            if (Array.isArray(state?.trickCards)) {
                renderTrickCards(state.trickCards);
            }
        } catch (err) {
            console.error('Error fetching game state:', err);
            $hands.find('.card-slot, img.card-img, img.img-fluid[data-card-id]').removeClass('animate-hidden').addClass('animate-visible');
        }
    }

    function renderTrickCards(trickCards){
        try {
            const norm = (tc) => {
                try {
                    if (!tc) return '';
                    if (tc.id !== undefined && tc.id !== null) return 'id:' + String(tc.id);
                    if (tc.code) return 'code:' + String(tc.code);
                    if (tc.imageUrl) {
                        const u = new URL(tc.imageUrl, window.location.origin);
                        return 'img:' + u.pathname; // ignore query/hash cache-busters
                    }
                    if (tc.label) return 'lbl:' + String(tc.label);
                } catch(_) {}
                try { return JSON.stringify(tc); } catch(_) { return String(tc); }
            };
            const sig = Array.isArray(trickCards)
                ? trickCards.map(norm).sort().join('|')
                : 'nil';
            if (window.__lastTrickSig === sig) return;
            window.__lastTrickSig = sig;
        } catch(_) {}

        const $allSections = $('#current_trick, .game__section[aria-label="Current Trick"], .game__section[aria-label="Aktueller Stich"]');
        if ($allSections.length === 0) return;

        try { $allSections.find('#trick-render-root .trick-cards, .trick-cards').remove(); } catch(_) {}

        let $section = $allSections.filter(':visible').first();
        if ($section.length === 0) $section = $allSections.first();

        try { $section.addClass('trick-render-active'); } catch(_) {}
        try { $allSections.not($section).removeClass('trick-render-active').addClass('trick-render-hidden'); } catch(_) {}

        let $root = $section.find('#trick-render-root');
        if ($root.length === 0) {
            $root = $('<div id="trick-render-root" />').appendTo($section);
        }
        try { $root.find('.trick-cards').remove(); } catch(_) {}

        const $row = $('<div class="trick-cards d-flex gap-2 p-1" />').appendTo($root);
        (trickCards || []).forEach(tc => {
            const $img = $('<img>', {
                class: 'img-fluid card-img',
                alt: '',
                title: tc.label || '' ,
                src: tc.imageUrl || ''
            });
            const $slot = $('<div>', { class: 'card-slot' }).append($img);
            $row.append($slot);
        });
    }

    function currentPlayerFromPath(){
        try {
            const path = window.location && window.location.pathname || '';
            if (path.startsWith('/play/')) return decodeURIComponent(path.substring('/play/'.length));
        } catch(_) {}
        return undefined;
    }

    async function refreshGameState() {
        if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.gameState)) return;
        const route = jsRoutes.controllers.HomeController.gameState();
        try {
            const player = currentPlayerFromPath();
            const state = await ajaxJson(route, { data: player ? { player } : undefined });
            const $hands = $('.game__hand');
            if (Array.isArray(state?.hands) && state.hands.length) {
                $hands.each(function(i){
                    renderHandCards($(this), state.hands[i] || []);
                });
            } else {
                const $mainHand = $hands.first();
                renderHandCards($mainHand, state?.handCards || []);
            }
            $hands.find('.card-slot, img.card-img, img.img-fluid[data-card-id]')
                .removeClass('animate-hidden')
                .addClass('animate-visible')
                .css('transition', '');
            updateScoreboard(state);
            if (Array.isArray(state?.trickCards)) {
                renderTrickCards(state.trickCards);
            }
        } catch (e) {
            console.error('refreshGameState failed', e);
        }
    }

    if (typeof window.refreshGameState !== 'function') {
        window.refreshGameState = function(){ try { return refreshGameState(); } catch(_){} };
    }

    // Ajax UI aktualisiern (Karten)
    $(function(){
        if (typeof jsRoutes === 'undefined' || !jsRoutes.controllers?.HomeController?.playCardJson) return;

        $(document).off('click', '.game__hand img.card-img, .game__hand img.img-fluid[data-card-id]')
                   .on('click', '.game__hand img.card-img, .game__hand img.img-fluid[data-card-id]', async function(e){
            e.preventDefault();
            e.stopPropagation();
            const $img = $(this);
            const cardId = $img.data('card-id');
            if (!cardId) return;
            if ($img.data('busy')) return;
            $img.data('busy', true).css('opacity', 0.6);
            try {
                const route = jsRoutes.controllers.HomeController.playCardJson();
                const player = currentPlayerFromPath();
                const res = await postJson(route, { cardId, player });
                if (res && res.ok) {
                    await refreshGameState();
                } else {
                    console.warn('playCardJson not ok', res);
                    if (res && res.error) {
                        try { window.toastr && toastr.warning(res.error); } catch(_) {}
                    }
                }
            } catch (err) {
                console.error('playCard failed', err);
                try {
                    const msg = (err && err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
                              : (err && err.responseText) ? String(err.responseText)
                              : 'Aktion fehlgeschlagen.';
                    if (window.toastr && msg) toastr.warning(msg);
                } catch(_) {}
            } finally {
                $img.data('busy', false).css('opacity', '');
            }
        });
    });

    // Ajax UI aktualisieren (Bid)
    $(function(){
        if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.bidJson)) return;

        $(document).off('click', '.js-bid-submit')
                   .on('click', '.js-bid-submit', async function(e){
            e.preventDefault(); e.stopPropagation();
            const $btn = $(this);
            const idx = $btn.data('index');
            const $input = $('#bid-' + idx);
            const value = ($input.val() ?? '').toString().trim();
            if (!value) {
                try { window.toastr && toastr.warning('Bitte eine Zahl eingeben.'); } catch(_) {}
                return;
            }
            const valueNum = Number(value);
            if (!Number.isInteger(valueNum) || valueNum < 0) {
                try { window.toastr && toastr.warning('Bitte eine nicht-negative ganze Zahl eingeben.'); } catch(_) {}
                return;
            }
            try {
                const $hand = $btn.closest('.game__hand');
                const playerName = $hand.find('.player-name').text().trim();
                const handCount = $hand.find('img.card-img, img.img-fluid[data-card-id]').length;
                if (handCount > 0 && valueNum > handCount) {
                    try { window.toastr && toastr.warning('Du kannst höchstens ' + handCount + ' Stiche ansagen.'); } catch(_) {}
                    return;
                }
            } catch(_) {}
            if ($btn.data('busy')) return;
            $btn.data('busy', true).prop('disabled', true).text('...');
            try {
                const route = jsRoutes.controllers.HomeController.bidJson();
                const player = currentPlayerFromPath();
                const res = await postJson(route, { bid: value, player });
                if (res && res.ok) {
                    $input.val('');
                    try {
                        const wc = document.getElementById('ingame-score');
                        if (wc) {
                            const current = Array.isArray(wc.scores) ? wc.scores.slice() : null;
                            if (current) {
                                const $hand = $btn.closest('.game__hand');
                                const playerName = $hand.find('.player-name').text().trim();
                                const i = current.findIndex(s => String(s.name) === playerName);
                                if (i >= 0) {
                                    current[i] = Object.assign({}, current[i], { bid: valueNum });
                                    setWizardScores(current);
                                }
                            }
                        }
                    } catch(_) {}
                    setTimeout(() => { refreshGameState(); }, 250);
                } else {
                    console.warn('bidJson not ok', res);
                    if (res && res.error) {
                        try { window.toastr && toastr.warning(res.error); } catch(_) {}
                    }
                }
            } catch (err) {
                console.error('bidJson failed', err);
                try {
                    const msg = (err && err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
                              : (err && err.responseText) ? String(err.responseText)
                              : 'Bid failed.';
                    if (window.toastr && msg) toastr.warning(msg);
                } catch(_) {}
            } finally {
                $btn.data('busy', false).prop('disabled', false).text('Submit');
            }
        });

        $(document).off('keydown', '.bid-input')
                   .on('keydown', '.bid-input', function(e){
            if (e.key === 'Enter') {
                e.preventDefault();
                const id = $(this).attr('id');
                const idx = id && id.startsWith('bid-') ? id.substring(4) : undefined;
                if (idx !== undefined) {
                    $(this).closest('.game__section').find('.js-bid-submit[data-index="' + idx + '"]').trigger('click');
                }
            }
        });

        function maybeWarnOnce($el, key, message){
            const now = Date.now();
            const last = Number($el.data(key) || 0);
            if (!last || (now - last) > 900) {
                try { window.toastr && toastr.warning(message); } catch(_) {}
                $el.data(key, now);
            }
        }

        $(document).off('input change', '.bid-input')
                   .on('input change', '.bid-input', function(){
            const $input = $(this);
            const raw = ($input.val() ?? '').toString().trim();
            if (!raw) return;
            const n = Number(raw);
            const maxAttr = $input.attr('max');
            const minAttr = $input.attr('min');
            const max = maxAttr ? Number(maxAttr) : undefined;
            const min = (minAttr !== undefined && minAttr !== null) ? Number(minAttr) : 0;

            if (!Number.isFinite(n)) {
                maybeWarnOnce($input, 'warn-nan', 'Bitte eine Zahl eingeben.');
                return;
            }
            if (!Number.isInteger(n)) {
                maybeWarnOnce($input, 'warn-int', 'Bitte eine ganze Zahl eingeben.');
                return;
            }
            if (n < (Number.isFinite(min) ? min : 0)) {
                maybeWarnOnce($input, 'warn-min', 'Der Wert darf nicht negativ sein.');
                $input.val(Math.max(0, min || 0));
                return;
            }
            if (Number.isFinite(max) && n > max) {
                maybeWarnOnce($input, 'warn-max', 'Du kannst höchstens ' + max + ' Stiche ansagen.');
                $input.val(max);
                return;
            }
        });
    });

    // Ajax Update
    function updateScoreboard(state){
        if (!state || !Array.isArray(state.players)) return;

        try {
            const scores = state.players.map(p => ({
                name: String(p?.name || ''),
                bid: Number((p && (p.roundBids ?? p.bid)) ?? 0),
                points: Number(p?.points ?? 0)
            }));
            setWizardScores(scores);
        } catch(_) {}

        const $grid = $('.game__section--scoreboard .score-grid');
        if ($grid.length > 0) {
            const $hdrs = $grid.find('.hdr');
            $grid.children().not($hdrs).remove();

            state.players.forEach(p => {
                const name = p.name ?? '';
                const bid = (p.roundBids ?? p.bid ?? '').toString();
                const points = (p.points ?? '').toString();
                $grid.append($('<div>').text(name));
                $grid.append($('<div>', { class: 'val' }).text(bid));
                $grid.append($('<div>', { class: 'val' }).text(points));
            });
        }
    }

    $(initAnimatedHands);

    (function setupLiveRefresh(){
        if (window.__wizardLiveRefreshSetup) return;
        window.__wizardLiveRefreshSetup = true;

        function visible(){
            return document.visibilityState === 'visible' || document.visibilityState === 'prerender';
        }

        function scheduleInterval(){
            if (window.__wizardLiveRefreshInterval) return;
            window.__wizardLiveRefreshInterval = setInterval(() => {
                try {
                    if (!visible()) return;
                    refreshGameState();
                } catch (e) { /* ignore */ }
            }, 1500);
        }

        window.addEventListener('focus', () => { if (visible()) refreshGameState(); }, { passive: true });
        document.addEventListener('visibilitychange', () => { if (visible()) refreshGameState(); }, { passive: true });
        window.addEventListener('pageshow', () => { if (visible()) refreshGameState(); }, { passive: true });

        scheduleInterval();
    })();
})(jQuery);