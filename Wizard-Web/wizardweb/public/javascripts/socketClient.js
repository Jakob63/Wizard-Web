(function(){
  var protocol = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
  var host = window.location.host;
  var wsUrl = protocol + '//' + host + '/game/socket';
  var socket;

  function getArea(){
    return document.getElementById('gameArea');
  }

  function setText(text){
    var area = getArea();
    if (area) area.textContent = text;
  }

  function append(html){
    var area = getArea();
    if (area) area.innerHTML = html;
  }

  function connect(){
    try {
      socket = new WebSocket(wsUrl);
    } catch (e) {
      console.error('WebSocket Verbindungsfehler', e);
      return;
    }

    socket.onopen = function(){
      console.log('WebSocket verbunden');
    };

    socket.onmessage = function(event){
      try {
        var msg = JSON.parse(event.data);
        var ev = msg.event;
        var data = msg.data || {};

        switch (ev) {
          case 'info':
            setText((data && data.message) ? ('Info: ' + data.message) : 'Info');
            break;
          case 'error.unknown.command':
            setText('Fehler: Unbekanntes Kommando' + ((data && data.name) ? (' (' + data.name + ')') : ''));
            break;
          case 'error.invalid.payload':
            setText('Fehler: Ungültiger Payload');
            break;
          case 'game.started':
            setText('Spiel gestartet');
            break;
          case 'round.started':
            setText('Runde gestartet: ' + (data.round ?? '?'));
            break;
          case 'trump.card':
            setText('Trumpfkarte: ' + (data.color ?? '?') + ' ' + (data.value ?? '?'));
            break;
          case 'players.hands.updated':
            setText('Spielerhände aktualisiert');
            break;
          case 'trick.card.played':
            setText('Karte in Stich: ' + (data.value ?? '?'));
            break;
          case 'round.finished':
            setText('Runde beendet: ' + (data.round ?? '?'));
            break;
          case 'player.event':
            setText(data.message ?? 'Spieler-Event');
            break;
          case 'player.names.prompt':
            setText('Bitte Namen eingeben (' + (data.current ?? 0) + '/' + (data.total ?? 0) + ')');
            break;
          case 'player.hand': {
            var cards = (data.cards || []).map(function(c){ return c.color + ' ' + c.value; }).join(', ');
            setText('Hand von ' + (data.player ?? '?') + ': ' + cards);
            break;
          }
          case 'player.play.card':
            setText((data.player ?? 'Spieler') + ' spielt ' + (data.color ?? '?') + ' ' + (data.value ?? '?'));
            break;
          default:
            if (typeof ev === 'string' && ev.endsWith('.accepted')) {
              setText(ev + ': ' + ((data && data.value) ? data.value : ''));
            } else if (typeof ev === 'string' && ev.endsWith('.rejected')) {
              setText(ev + ': ' + ((data && data.reason) ? data.reason : 'rejected'));
            } else {
              append('<pre>' + String(event.data).replace(/[&<>"]/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])}) + '</pre>');
            }
        }
      } catch(e) {
        console.error('Konnte Nachricht nicht als JSON parsen.', e);
        setText(event.data);
      }
    };

    socket.onerror = function(err){
      console.log('WebSocket-Fehler: ', err);
    };

    socket.onclose = function(){
      console.log('WebSocket geschlossen');
    };

    var btn = document.getElementById('sendButton');
    if (btn) {
      btn.addEventListener('click', function(){
        try { socket && socket.send(JSON.stringify({ name: 'start' })); } catch(e) { console.error(e); }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
})();
