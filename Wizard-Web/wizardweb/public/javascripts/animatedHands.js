// javascript
(function($) {
    const perCardDelay = 300;
    const betweenPlayersDelay = 420;
    const animationDuration = 320;
    const initialDelay = 420;

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
`;
    $('head').append($('<style>').text(css));

    $(function() {
        // Reduced motion beachten
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            $('.game__hand .card').removeClass('animate-hidden').addClass('animate-visible');
            return;
        }

        const $hands = $('.game__hand');
        if ($hands.length === 0) return;

        // Karten verstecken
        $hands.find('.card').each(function() {
            $(this).addClass('animate-hidden').removeClass('animate-visible')
                .css('transition', `transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease`);
        });

        let totalDelay = initialDelay;
        $hands.each(function() {
            const $cards = $(this).find('.card');
            $cards.each(function(idx) {
                const $c = $(this);
                const showAt = totalDelay + idx * perCardDelay;
                setTimeout(function() {
                    $c.removeClass('animate-hidden').addClass('animate-visible');
                }, showAt);
            });
            totalDelay += $cards.length * perCardDelay + betweenPlayersDelay;
        });
    });
})(jQuery);