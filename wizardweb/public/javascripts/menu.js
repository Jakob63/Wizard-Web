// CSRF helper: read Play's CSRF token from cookie and attach it to all AJAX requests
function getCookie(name){
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\\/\+^]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
}

function getCsrfHeaderValue(){
    try {
        let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) token = getCookie('PLAY_CSRF_TOKEN');
        // Play expects the literal header value "nocheck" (without dash) to bypass CSRF in trusted contexts
        return token || 'nocheck';
    } catch(_) { return 'nocheck'; }
}

// We no longer attach CSRF headers from the client. The backend is configured to exempt
// JSON API paths (/api/**) from CSRF, and we also strip any CSRF tokens from query strings.
// This avoids conflicts where Play rejects requests due to mismatched/stale query tokens.
// If you re-enable CSRF protection on these endpoints, you may restore the header logic.

function stripCsrfQuery(urlObj){
    try {
        // Some Play setups append a CSRF token to reverse-routed URLs, e.g. ?csrfToken=...
        // When we intentionally use header Csrf-Token: nocheck for JSON calls,
        // any token in the query string must be removed to avoid CSRF rejections.
        const params = urlObj.searchParams;
        [
            'csrfToken', // Play default
            'csrf',
            '_csrf',
            '_csrfToken',
            'xsrfToken',
            'X-CSRF-Token',
            'x-csrf-token',
            '_token'
        ].forEach((n) => { try { params.delete(n); } catch(_) {} });
        // Apply back (empty string if no params left)
        const s = params.toString();
        urlObj.search = s ? ('?' + s) : '';
    } catch(_) {}
}

function toSameOrigin(u){
    try {
        if (!u) return u;
        // Normalize relative/absolute against current location
        const url = new URL(u, window.location.href);
        // Always strip any csrf token carried in query string
        stripCsrfQuery(url);
        if (url.origin === window.location.origin) {
            return url.href;
        }
        // If absolute to a different origin, return a path to let the Vite proxy (5173) keep same-origin
        return url.pathname + (url.search || '') + (url.hash || '');
    } catch(_) { return u; }
}

function resolveRouteUrl(routeOrUrl){
    try {
        if (!routeOrUrl) return routeOrUrl;
        if (typeof routeOrUrl === 'string') {
            return toSameOrigin(routeOrUrl);
        }
        const raw = (typeof routeOrUrl.url === 'function') ? routeOrUrl.url() : routeOrUrl.url;
        if (typeof raw === 'string' && raw.length > 0) {
            return toSameOrigin(raw);
        }
        const str = String(routeOrUrl || '');
        return toSameOrigin(str);
    } catch(_) { return (typeof routeOrUrl === 'string') ? routeOrUrl : ''; }
}

function apiCall(route, options = {}) {
    return $.ajax({
        url: resolveRouteUrl(route),
        method: route.type,
        data: options.data,
        dataType: 'json',
        timeout: options.timeout || 15000,
        xhrFields: { withCredentials: true }
    });
}

function postJson(route, payload) {
    return $.ajax({
        url: resolveRouteUrl(route),
        method: route.type || 'POST',
        data: JSON.stringify(payload),
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        timeout: 15000,
        xhrFields: { withCredentials: true }
    });
}

function showInlineError(selector, message) {
    const $box = $(selector);
    if ($box.length === 0) { alert(message); return; }
    $box.text(message).show();
}

function debounce(fn, ms){ let t; return function(){ clearTimeout(t); const a=arguments, ctx=this; t=setTimeout(()=>fn.apply(ctx, a), ms);}}

function getPlayerCount(){
    const fromHidden = parseInt($('#playerCount').val(), 10);
    if (!isNaN(fromHidden) && fromHidden >= 3 && fromHidden <= 6) return fromHidden;
    const cnt = $('#nameForm input[id^="name"]').length;
    if (cnt >= 3 && cnt <= 6) return cnt;
    return 3;
}

function readNames(){
    const count = getPlayerCount();
    const arr = [];
    for (let i = 1; i <= count; i++) {
        arr.push($('#name' + i).val() || '');
    }
    return arr;
}

function writeNames(players){
    if(!Array.isArray(players) || players.length === 0) return;
    const count = getPlayerCount();
    for (let i = 1; i <= count; i++) {
        const val = players[i-1] || '';
        const $inp = $('#name' + i);
        if ($inp.length) $inp.val(val).trigger('input');
    }
}

const autoSubmit = debounce(function(){
    const players = readNames();
    if (players.some(n => !n || !n.trim())) return;
    submitNames();
}, 700);

async function fillNamesFromPreset(presetId){
    if (!presetId) return;
    if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.playerPreset)) return;
    const route = jsRoutes.controllers.HomeController.playerPreset(Number(presetId));
    try {
        const data = await apiCall(route);
        if (data && Array.isArray(data.players)) {
            writeNames(data.players);
            autoSave();
            autoSubmit();
        }
    } catch (e) { console.error('playerPreset failed', e); }
}

const autoSave = debounce(function(){
    if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.savePlayersJson)) return;
    const players = readNames();
    if (players.some(n => !n || !n.trim())) return;
    const route = jsRoutes.controllers.HomeController.savePlayersJson();
    postJson(route, { players }).catch(err => console.warn('Auto-save failed', err));
}, 500);

function submitNames(){
    if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.createPlayersJson)) return;
    const players = readNames();
    if (players.some(n => !n || !n.trim())) { showInlineError('#namesError', 'Bitte geben Sie alle Namen ein.'); return; }
    const ingame = '/ingame';
    const route = jsRoutes.controllers.HomeController.createPlayersJson();
    return postJson(route, { players })
        .then(data => {
            if (data?.error) {
                showInlineError('#namesError', 'Fehler beim Erstellen der Spieler.');
            } else {
                setTimeout(() => { try { window.location.assign(ingame); } catch(_) { window.location.href = ingame; } }, 100);
            }
        })
        .catch(err => {
            console.error('submitNames fehlgeschlagen', err);
            showInlineError('#namesError', 'Fehler beim Erstellen der Spieler. Bitte versuchen Sie es erneut.');
        });
}

// jquery event
$(function() {
    const $form = $('#nameForm');
    if ($form.length) {
        $form.on('submit', function (e) {
            e.preventDefault();
            try { submitNames(); } catch(e){ console.error('submitNames error', e); }
        });
        $('#presetList').on('change', function () {
            fillNamesFromPreset(this.value);
        });
        $form.on('input change', 'input[id^=name]', function () {
            autoSave();
            autoSubmit();
        });
    }
});


function submitChoice(btn) {
    const val = btn.dataset.val;
    const route = jsRoutes.controllers.HomeController.demoOfferJson();
    return postJson(route, { choice: val })
        .then(data => {
            if (data && data.message) {
                window.location.href = data.message;
            }
        })
        .catch(err => console.error('Error:', err));
}
