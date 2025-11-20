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
            const state = await ajaxJson(route);
            const $hands = $('.game__hand');
            if (Array.isArray(state?.hands)) {
                $hands.each(function(i){
                    renderHandCards($(this), state.hands[i] || []);
                });
            } else {
                const $mainHand = $hands.first();
                renderHandCards($mainHand, state?.handCards || []);
            }
            applyHiddenState($hands);
            playStaggeredReveal($hands);
        } catch (err) {
            console.error('Error fetching game state:', err);
            $hands.find('.card-slot, .card-img').removeClass('animate-hidden').addClass('animate-visible');
        }
    }

    async function refreshGameState() {
        if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.gameState)) return;
        const route = jsRoutes.controllers.HomeController.gameState();
        try {
            const state = await ajaxJson(route);
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
        } catch (e) {
            console.error('refreshGameState failed', e);
        }
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
            if ($img.data('busy')) return; // Spam verhindern
            $img.data('busy', true).css('opacity', 0.6);
            try {
                const route = jsRoutes.controllers.HomeController.playCardJson();
                const res = await postJson(route, { cardId });
                if (res && res.ok) {
                    updateCurrentTricks($img);
                    await refreshGameState();
                } else {
                    console.warn('playCardJson not ok', res);
                }
            } catch (err) {
                console.error('playCard failed', err);
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
            if (!value) return;
            if ($btn.data('busy')) return;
            $btn.data('busy', true).prop('disabled', true).text('...');
            try {
                const route = jsRoutes.controllers.HomeController.bidJson();
                const res = await postJson(route, { bid: value });
                if (res && res.ok) {
                    $input.val('');
                    setTimeout(() => { refreshGameState(); }, 250);
                } else {
                    console.warn('bidJson not ok', res);
                }
            } catch (err) {
                console.error('bidJson failed', err);
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

    // Ajax update
    async function updateCurrentTricks($img) {
        if (!$img || $img.length === 0) return;
        const $section = $(".game__section[aria-label='Aktueller Stich']");
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

        let $block = $img.closest('.md-3');
        if ($block.length === 0) $block = $img.closest('.card-slot');
        if ($block.length === 0) $block = $img;

        $block.find('.card-img').addBack('.card-img')
            .removeClass('animate-hidden animate-visible')
            .css({transition: '', opacity: ''});

        $block.detach();
        $row.append($block);
    }

    $(initAnimatedHands);
})(jQuery);