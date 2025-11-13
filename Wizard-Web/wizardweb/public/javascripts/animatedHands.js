// javascript
(function($) {
    const perCardDelay = 120;          // ms zwischen den Karten eines Spielers
    const betweenPlayersDelay = 420;   // ms Pause zwischen Spielern
    const animationDuration = 320;     // Transition-Dauer in ms
    const initialDelay = 60;

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

        // Alle Karten initial verstecken und Transition setzen
        $hands.find('.card').each(function() {
            $(this).addClass('animate-hidden').removeClass('animate-visible')
                .css('transition', `transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease`);
        });

        // Nacheinander pro Spieler anzeigen
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