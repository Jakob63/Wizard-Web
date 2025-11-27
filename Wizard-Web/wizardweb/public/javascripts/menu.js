$.ajaxSetup({
    beforeSend: function(xhr){
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) xhr.setRequestHeader('Csrf-Token', token);
    }
});

function apiCall(route, options = {}) {
    return $.ajax({
        url: route.url,
        method: route.type,
        data: options.data,
        dataType: 'json',
        timeout: options.timeout || 15000
    });
}

function postJson(route, payload) {
    return $.ajax({
        url: route.url,
        method: route.type || 'POST',
        data: JSON.stringify(payload),
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        timeout: 15000
    });
}

function showInlineError(selector, message) {
    const $box = $(selector);
    if ($box.length === 0) { alert(message); return; }
    $box.text(message).show();
}

function debounce(fn, ms){ let t; return function(){ clearTimeout(t); const a=arguments, ctx=this; t=setTimeout(()=>fn.apply(ctx, a), ms);}}

function readNames(){
    return [$('#name1').val()||'', $('#name2').val()||'', $('#name3').val()||''];
}

function writeNames(players){
    if(!players||players.length<3) return;
    $('#name1').val(players[0]||'').trigger('input');
    $('#name2').val(players[1]||'').trigger('input');
    $('#name3').val(players[2]||'').trigger('input');
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

    //var form = document.getElementById('choiceForm');
    //form.action = '/demo_input/' + encodeURIComponent(val);
    //form.submit();

function submitNames(){
    if (!(window.jsRoutes && jsRoutes.controllers?.HomeController?.createPlayersJson)) return;
    const players = readNames();
    if (players.some(n => !n || !n.trim())) { showInlineError('#namesError', 'Bitte geben Sie alle Namen ein.'); return; }
    let urls = [];
    try {
        urls = players.map(n => '/play/' + encodeURIComponent(n));
        const wins = urls.map((u) => {
            try {
                const w = window.open(u, '_blank');
                if (!w) console.warn('Popup blockiert', u);
                return w;
            } catch(e) { console.warn('Popup blockiert (direct)', e); return null; }
        });
        window.__playersTabsOpened = true;
        window.__playersTabsUrls = urls;
        window.__playersWindows = wins;
        const first = urls[0];
        if (first) setTimeout(() => { try { window.location.assign(first); } catch(_) {} }, 100);
    } catch(e) {
        console.warn('Synchrones Öffnen der Tabs fehlgeschlagen', e);
    }
    const route = jsRoutes.controllers.HomeController.createPlayersJson();
    return postJson(route, { players })
        .then(data => {
            if (Array.isArray(data?.tabs) && data.tabs.length) {
                const targetUrls = data.tabs;
                const first = data.first || targetUrls[0];
                if (window.__playersTabsOpened && Array.isArray(window.__playersWindows)) {
                    targetUrls.forEach((u, i) => {
                        const w = window.__playersWindows[i];
                        try {
                            if (w && !w.closed) {
                                if (w.location && w.location.href !== u) {
                                    w.location.replace(u);
                                }
                            } else {
                                const nw = window.open(u, '_blank');
                                if (!nw) console.warn('Popup-Blocker verhinderte Fallback-Tab', u);
                            }
                        } catch(e) {
                            console.warn('Navigation in vorgeöffnetem Tab fehlgeschlagen', e);
                            const nw = window.open(u, '_blank');
                            if (!nw) console.warn('Popup-Blocker verhinderte Fallback-Tab', u);
                        }
                    });
                    setTimeout(() => { try { window.location.assign(first); } catch(_) {} }, 100);
                } else {
                    try {
                        targetUrls.forEach(u => {
                            const w = window.open(u, '_blank');
                            if (!w) console.warn('Popup-Blocker verhindert Tab', u);
                        });
                        setTimeout(() => { window.location.assign(first); }, 150);
                    } catch(e) {
                        console.error('Konnte Tabs nicht öffnen', e);
                        window.location.assign(first);
                    }
                }
            } else if (data?.message && !window.__playersTabsOpened) {
                setTimeout(() => { window.location.href = data.message; }, 350);
            } else {
                showInlineError('#namesError', 'Fehler beim Erstellen der Spieler.');
            }
        })
        .catch(err => { console.error('submitNames fehlgeschlagen', err); showInlineError('#namesError', 'Fehler beim Erstellen der Spieler. Bitte versuchen Sie es erneut.'); });
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
        $form.on('input change', '#name1, #name2, #name3', function () {
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
