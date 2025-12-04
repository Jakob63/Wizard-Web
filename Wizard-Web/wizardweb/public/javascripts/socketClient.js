(function(){
  var protocol = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
  var host = window.location.host;
  var wsUrl = protocol + '//' + host + '/game/socket';
  var socket;

  function getArea(){
    return document.getElementById('gameArea');
  }

  function setText(text){
    if (window.gameUI && typeof window.gameUI.setText === 'function') {
      try { window.gameUI.setText(String(text)); return; } catch(e) { console.error(e); }
    }
    var area = getArea();
    if (area) area.textContent = text;
  }

  function append(html){
    if (window.gameUI && typeof window.gameUI.append === 'function') {
      try { window.gameUI.append(String(html)); return; } catch(e) { console.error(e); }
    }
    var area = getArea();
    if (area) area.innerHTML = html;
  }

  function connect(){
    try {
      socket = new WebSocket(wsUrl);
    } catch (e) {
      console.error('WebSocket connection error', e);
      return;
    }

    socket.onopen = function(){
      console.log('WebSocket connected');
    };

    socket.onmessage = function(event){
      try {
        var msg = JSON.parse(event.data);
        var ev = msg.event;
        var data = msg.data || {};

        if (window.gameUI && typeof window.gameUI.onEvent === 'function') {
          try { window.gameUI.onEvent(msg); } catch(e) { console.error(e); }
        }

        switch (ev) {
          case 'info':
            setText((data && data.message) ? ('Info: ' + data.message) : 'Info');
            break;
          case 'error.unknown.command':
            setText('Error: Unknown command' + ((data && data.name) ? (' (' + data.name + ')') : ''));
            break;
          case 'error.invalid.payload':
            setText('Error: Invalid payload');
            break;
          case 'game.started':
            setText('Game started');
            break;
          case 'round.started':
            setText('Round started: ' + (data.round ?? '?'));
            break;
          case 'trump.card':
            setText('Trump card: ' + (data.color ?? '?') + ' ' + (data.value ?? '?'));
            break;
          case 'players.hands.updated':
            setText("Players' hands updated");
            break;
          case 'trick.card.played':
            setText('Card in trick: ' + (data.value ?? '?'));
            try { if (typeof window.refreshGameState === 'function') { window.refreshGameState(); } } catch (__) {}
            break;
          case 'round.finished':
            setText('Round finished: ' + (data.round ?? '?'));
            break;
          case 'player.event':
            setText(data.message ?? 'Player event');
            break;
          case 'player.names.prompt':
            setText('Please enter names (' + (data.current ?? 0) + '/' + (data.total ?? 0) + ')');
            break;
          case 'player.hand': {
            var cards = (data.cards || []).map(function(c){ return c.color + ' ' + c.value; }).join(', ');
            setText('Hand of ' + (data.player ?? '?') + ': ' + cards);
            break;
          }
          case 'player.play.card':
            setText((data.player ?? 'Player') + ' plays ' + (data.color ?? '?') + ' ' + (data.value ?? '?'));
            try { if (typeof window.refreshGameState === 'function') { window.refreshGameState(); } } catch (__) {}
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
        console.error('Could not parse message as JSON.', e);
        setText(event.data);
      }
    };

    socket.onerror = function(err){
      console.log('WebSocket error: ', err);
    };

    socket.onclose = function(){
      console.log('WebSocket closed');
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
