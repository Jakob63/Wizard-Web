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
    const route = jsRoutes.controllers.HomeController.createPlayersJson();
    return postJson(route, { players })
        .then(data => {
            if (data?.message) {
                setTimeout(() => { window.location.href = data.message; }, 350);
            } else {
                showInlineError('#namesError', 'Fehler beim Erstellen der Spieler.');
            }
        })
        .catch(err => { console.error('submitNames fehlgeschlagen', err); showInlineError('#namesError', 'Fehler beim Erstellen der Spieler. Bitte versuchen Sie es erneut.'); });
}

$(function() {
    const $form = $('#nameForm');
    if ($form.length) {
        $form.on('submit', function (e) {
            e.preventDefault();
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
