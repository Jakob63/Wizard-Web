(function($) {
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
}`;
        const styleEl = document.createElement('style');
        styleEl.id = 'animated-hands-style';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    })();

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
        $allHands.find('.card-slot, .card-img').each(function () {
            $(this)
                .addClass('animate-hidden')
                .removeClass('animate-visible')
                .css('transition', `transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease`);
        });
    }

    function playStaggeredReveal($allHands) {
        let totalDelay = initialDelay;
        $allHands.each(function () {
            const $cards = $(this).find('.card-slot, .card-img');
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
            $hands.find('.card-slot, .card-img').removeClass('animate-hidden').addClass('animate-visible');
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
            $hands.find('.card-slot, .card-img').removeClass('animate-hidden').addClass('animate-visible');
        }
    }

    function renderTrickCards(trickCards){
        let $section = $(".game__section[aria-label='Current Trick']");
        if ($section.length === 0) {
            $section = $(".game__section[aria-label='Aktueller Stich']");
        }
        if ($section.length === 0) return;
        let $row = $section.find('.trick-cards');
        if ($row.length === 0) {
            $row = $section.find("div[style*='display: flex']").first();
            if ($row.length) {
                $row.addClass('trick-cards');
            } else {
                $row = $('<div class="trick-cards d-flex gap-2 p-1" />').appendTo($section);
            }
        }
        $row.empty();
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
            $hands.find('.card-slot, .card-img')
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

        $(document).on('click', '.game__hand .card-img', async function(e){
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

        $(document).on('click', '.js-bid-submit', async function(e){
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
                const handCount = $hand.find('.card-img').length;
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

        $(document).on('keydown', '.bid-input', function(e){
            if (e.key === 'Enter') {
                e.preventDefault();
                const id = $(this).attr('id');
                const idx = id && id.startsWith('bid-') ? id.substring(4) : undefined;
                if (idx !== undefined) {
                    $(this).closest('.game__section').find('.js-bid-submit[data-index="' + idx + '"]').trigger('click');
                }
            }
        });

        // Sofortige visuelle Warnungen bei ungültiger Eingabe (manuell oder per Pfeile)
        function maybeWarnOnce($el, key, message){
            const now = Date.now();
            const last = Number($el.data(key) || 0);
            if (!last || (now - last) > 900) {
                try { window.toastr && toastr.warning(message); } catch(_) {}
                $el.data(key, now);
            }
        }

        $(document).on('input change', '.bid-input', function(){
            const $input = $(this);
            const raw = ($input.val() ?? '').toString().trim();
            if (!raw) return; // Keine Warnung bei leerem Feld
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
        const $grid = $('.game__section--scoreboard .score-grid');
        if ($grid.length === 0) return;

        const $hdrs = $grid.find('.hdr');
        $grid.children().not($hdrs).remove();

        state.players.forEach(p => {
            const name = p.name ?? '';
            const bid = (p.roundBids ?? '').toString();
            const points = (p.points ?? '').toString();
            $grid.append($('<div>').text(name));
            $grid.append($('<div>', { class: 'val' }).text(bid));
            $grid.append($('<div>', { class: 'val' }).text(points));
        });
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