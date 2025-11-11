(function () {
  // Robust single-initialization guard to avoid duplicate layers (e.g., if the script is injected twice)
  if (typeof window !== 'undefined') {
    if (window.__runesInitStarted) {
      try { console.log('[runes] aborted: already initialized'); } catch (e) {}
      return;
    }
    window.__runesInitStarted = true;
  }
  try { console.log('[runes] script loaded'); } catch (e) {}
  try { window.__runesLoaded = true; } catch (e) {}

  // Enable only on home route and in light mode
  var isHome = (document.body && document.body.classList && document.body.classList.contains('page-home')) ||
               window.location.pathname === '/' ||
               (typeof window.location.pathname === 'string' && window.location.pathname.indexOf('/home') === 0);
  var isLightMode = function () {
    var el = document.documentElement || document.body;
    var attr = el.getAttribute('data-bs-theme') || 'auto';
    var prefersLight = false;
    try { prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; } catch (e) { prefersLight = false; }
    var hasLightClass = (document.documentElement.classList && document.documentElement.classList.contains('theme-light')) ||
                        (document.body && document.body.classList && document.body.classList.contains('theme-light'));
    return attr === 'light' || (attr === 'auto' && prefersLight) || hasLightClass;
  };

  if (!isHome) { try { console.log('[runes] skipped: not on home route', window.location.pathname); } catch (e) {} return; }
  if (!isLightMode()) { try { console.log('[runes] skipped: not in light mode'); } catch (e) {} return; }

  var prefersReduced = false;
  try { prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Helper
  function rand(min, max) { return Math.random() * (max - min) + min; }

  // Avoid duplicate container if present
  var existing = document.getElementById('runes-layer');
  if (existing) {
    try { console.log('[runes] container already exists, aborting duplicate init'); } catch (e) {}
    return;
  }
  // Create container
  var container = document.createElement('div');
  container.id = 'runes-layer';
  container.className = 'rune-bg';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  // Place runes behind the main content so the title stays in front
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  // Inject keyframes if missing (rotate + fade)
  (function ensureStyles(){
    if (document.getElementById('runes-keyframes')) return;
    var style = document.createElement('style');
    style.id = 'runes-keyframes';
    style.textContent = '\n@keyframes runeRotate { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }\n@keyframes runeFade { 0%,100%{ opacity: 0;} 50%{ opacity: 0.5;} }\n';
    document.head.appendChild(style);
  })();

  // Try to find external SVG rune assets in /assets/images/runes/
  var base = '/assets/images/runes/';
  var nameSets = [
    Array.from({length: 40}, function(_,i){ var n=i+1; return 'rune' + (n<10?('0'+n):n) + '.svg'; }),
    Array.from({length: 40}, function(_,i){ return 'rune' + (i+1) + '.svg'; }),
    Array.from({length: 40}, function(_,i){ var n=i+1; return 'glyph' + (n<10?('0'+n):n) + '.svg'; })
  ];
  var candidates = [].concat.apply([], nameSets);

  function probeAssets(maxToFind) {
    var found = [];
    var idx = 0;
    return new Promise(function(resolve){
      function next() {
        if (idx >= candidates.length) return resolve(found);
        if (found.length >= maxToFind) return resolve(found);
        var url = base + candidates[idx++];
        fetch(url, { method: 'GET', cache: 'no-cache' }).then(function(res){
          if (res && res.ok) found.push(url);
        }).catch(function(){/* ignore */}).finally(function(){
          // Slightly batch the probing to keep UI responsive
          if (idx % 5 === 0) setTimeout(next, 0); else next();
        });
      }
      next();
    });
  }

  function startImages(spriteUrls) {
    try { console.log('[runes] using SVG assets', spriteUrls.length); } catch (e) {}
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var area = w * h;
    var COUNT = Math.min(64, Math.max(24, Math.floor(area / 55000)));

    // Non-overlapping, stratified placement to avoid clustering and large empty areas
    var PAD_PCT = 0.06; // keep away from very edge (6%)
    var MIN_SIZE = 16;  // px – all runes small
    var MAX_SIZE = 42;  // px – tight small band
    var PADDING_FACTOR = 0.14; // slightly tighter packing; glow margin still applied
    var DIAGONAL_FACTOR = 0.70710678; // sqrt(2)/2 to approximate rotated square radius
    var GLOW_MARGIN = 12; // extra pixels to account for drop-shadow/glow

    // Build desired sizes with a bimodal distribution: many small, more large than before (capped)
    var sizes = [];
    var LARGE_MIN = 70, LARGE_MAX = 140; // px – increase size band for large runes
    var maxLargeCap = 14; // higher cap to allow more large runes when space permits
    var desiredLarge = Math.floor(COUNT * 0.35) + 2; // ~35% large + slight boost for 1–2 more big runes
    var largeCount = Math.max(2, Math.min(maxLargeCap, COUNT, desiredLarge));
    var smallCount = Math.max(0, COUNT - largeCount);

    // Large runes first (so they place first after sort)
    for (var li = 0; li < largeCount; li++) {
      var lt = Math.random();
      sizes.push(LARGE_MIN + (LARGE_MAX - LARGE_MIN) * lt);
    }
    // Small runes
    for (var si = 0; si < smallCount; si++) {
      var st = Math.random();
      sizes.push(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * st);
    }
    // Sort larger first for easier packing
    sizes.sort(function(a,b){ return b - a; });

    // Stratify viewport into a coarse grid to guarantee coverage
    var cols = 3, rows = 3; // 3x3 grid
    var cellW = w / cols, cellH = h / rows;
    var placed = [];

    function canPlace(cx, cy, rPx) {
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        var dx = cx - p.x;
        var dy = cy - p.y;
        var minDist = (rPx + p.r) * (1 + PADDING_FACTOR);
        if (dx*dx + dy*dy < minDist*minDist) return false;
      }
      return true;
    }

    function clamp(v, min, max){ return v < min ? min : (v > max ? max : v); }

    // Edge padding box
    var minX = PAD_PCT * w, maxX = (1 - PAD_PCT) * w;
    var minY = PAD_PCT * h, maxY = (1 - PAD_PCT) * h;

    // First pass A removed: no fixed corner prioritization. We want free spawning while keeping coverage.
    var sIndex = 0;

    // First pass B: seed one rune per shuffled grid cell (if available)
    var cells = [];
    for (var rci = 0; rci < rows; rci++) {
      for (var cci = 0; cci < cols; cci++) cells.push({row: rci, col: cci});
    }
    // shuffle cells to avoid deterministic positions for large runes
    for (var sh = cells.length - 1; sh > 0; sh--) {
      var j = (Math.random() * (sh + 1)) | 0;
      var tmp = cells[sh]; cells[sh] = cells[j]; cells[j] = tmp;
    }
    for (var ci = 0; ci < cells.length && sIndex < sizes.length; ci++) {
      var cell = cells[ci];
      var sizePx = sizes[sIndex];
      var rPx = sizePx * DIAGONAL_FACTOR + GLOW_MARGIN;
      var cx = (cell.col + 0.5) * cellW;
      var cy = (cell.row + 0.5) * cellH;
      // jitter within cell
      var jitterX = rand(-cellW*0.25, cellW*0.25);
      var jitterY = rand(-cellH*0.25, cellH*0.25);
      cx += jitterX; cy += jitterY;
      cx = clamp(cx, minX + rPx, maxX - rPx);
      cy = clamp(cy, minY + rPx, maxY - rPx);
      // try few attempts to avoid conflicts
      var attempts = 0, ok = false;
      while (attempts++ < 15) {
        if (canPlace(cx, cy, rPx)) { ok = true; break; }
        cx = clamp((cell.col + rand(0.25,0.75)) * cellW, minX + rPx, maxX - rPx);
        cy = clamp((cell.row + rand(0.25,0.75)) * cellH, minY + rPx, maxY - rPx);
      }
      if (ok) { placed.push({ x: cx, y: cy, r: rPx, size: sizePx }); sIndex++; }
    }

    // Safety: ensure each corner cell has at least one rune; if missing, try to place a small one there
    function hasRuneInCornerCell(colIdx, rowIdx) {
      for (var k = 0; k < placed.length; k++) {
        var p = placed[k];
        var pc = Math.max(0, Math.min(cols-1, Math.floor(p.x / cellW)));
        var pr = Math.max(0, Math.min(rows-1, Math.floor(p.y / cellH)));
        if (pc === colIdx && pr === rowIdx) return true;
      }
      return false;
    }
    var cornerTargets = [ {c:0,r:0}, {c:cols-1,r:0}, {c:0,r:rows-1}, {c:cols-1,r:rows-1} ];
    for (var ct = 0; ct < cornerTargets.length; ct++) {
      if (sIndex >= sizes.length) break;
      var tgt = cornerTargets[ct];
      if (hasRuneInCornerCell(tgt.c, tgt.r)) continue;
      // pick a small size from remaining by scanning from the end
      var chosenIdx = sizes.length - 1;
      if (chosenIdx < sIndex) chosenIdx = sIndex;
      var sizePx2 = sizes[chosenIdx];
      var rPx2 = sizePx2 * DIAGONAL_FACTOR + GLOW_MARGIN;
      var baseX = (tgt.c + 0.5) * cellW;
      var baseY = (tgt.r + 0.5) * cellH;
      var px2 = clamp(baseX, minX + rPx2, maxX - rPx2);
      var py2 = clamp(baseY, minY + rPx2, maxY - rPx2);
      var attemptsC = 0, okC = false;
      while (attemptsC++ < 25) {
        if (canPlace(px2, py2, rPx2)) { okC = true; break; }
        px2 = clamp((tgt.c + rand(0.25,0.75)) * cellW, minX + rPx2, maxX - rPx2);
        py2 = clamp((tgt.r + rand(0.25,0.75)) * cellH, minY + rPx2, maxY - rPx2);
      }
      if (okC) {
        placed.push({ x: px2, y: py2, r: rPx2, size: sizePx2 });
        // remove chosen size by swapping with sIndex if chosenIdx != sIndex, then increment sIndex
        if (chosenIdx !== sIndex) { var tmpSz = sizes[sIndex]; sizes[sIndex] = sizes[chosenIdx]; sizes[chosenIdx] = tmpSz; }
        sIndex++;
      }
    }

    // Second pass: place remaining runes anywhere without overlap
    while (sIndex < sizes.length) {
      var sPx = sizes[sIndex];
      var rad = sPx * DIAGONAL_FACTOR + GLOW_MARGIN;
      var attempts2 = 0, ok2 = false, px = 0, py = 0;
      while (attempts2++ < 80 && !ok2) {
        px = rand(minX + rad, maxX - rad);
        py = rand(minY + rad, maxY - rad);
        if (canPlace(px, py, rad)) ok2 = true;
      }
      if (!ok2) { // give up this rune to avoid endless loop
        sIndex++;
        continue;
      }
      placed.push({ x: px, y: py, r: rad, size: sPx });
      sIndex++;
    }

    // Create DOM elements from placements
    for (var i = 0; i < placed.length; i++) {
      var info = placed[i];
      var img = document.createElement('img');
      img.src = spriteUrls[(Math.random() * spriteUrls.length) | 0];
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'eager';
      img.style.position = 'absolute';
      img.style.left = (info.x / w * 100).toFixed(2) + '%';
      img.style.top = (info.y / h * 100).toFixed(2) + '%';
      img.style.width = info.size.toFixed(1) + 'px';
      img.style.height = 'auto';
      img.style.transform = 'translate(-50%, -50%) rotate(' + Math.floor(rand(0,360)) + 'deg)';
      img.style.transformOrigin = 'center center';
      img.style.willChange = 'transform, opacity, filter';
      img.style.opacity = '0';
      img.style.filter = 'invert(14%) sepia(88%) saturate(6000%) hue-rotate(258deg) brightness(90%) contrast(105%) drop-shadow(0 0 18px rgba(170,80,255,0.75)) drop-shadow(0 0 40px rgba(160,70,255,0.50)) drop-shadow(0 0 70px rgba(140,60,245,0.25))';
      img.style.mixBlendMode = 'screen';
      if (!prefersReduced) {
        var rotDur = Math.round(rand(70, 190));
        var fadeDur = Math.round(rand(16, 38));
        img.style.animation = 'runeRotate ' + rotDur + 's linear infinite, runeFade ' + fadeDur + 's ease-in-out infinite';
        var dir1 = (Math.random() < 0.5 ? 'normal' : 'reverse');
        var dir2 = (Math.random() < 0.5 ? 'normal' : 'reverse');
        img.style.animationDirection = dir1 + ', ' + dir2;
        img.style.animationFillMode = 'both, both';
        img.style.animationDelay = Math.round(rand(0, 20)) + 's, ' + Math.round(rand(0, 12)) + 's';
      } else {
        img.style.opacity = '0.12';
      }
      container.appendChild(img);
    }

    observeTheme(container);
  }

  function startCanvas() {
    try { console.log('[runes] falling back to Canvas glyphs'); } catch (e) {}
    var canvas = document.createElement('canvas');
    canvas.id = 'runeCanvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    function resize() {
      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function drawGlyph(ctx, id) {
      ctx.beginPath();
      switch (id) {
        case 1: ctx.moveTo(10,2); ctx.lineTo(18,10); ctx.lineTo(10,18); ctx.lineTo(2,10); ctx.closePath(); ctx.moveTo(10,4); ctx.lineTo(10,16); ctx.moveTo(4,10); ctx.lineTo(16,10); break;
        case 2: ctx.arc(10,10,8,0,Math.PI*2); ctx.moveTo(10,4); ctx.lineTo(10,16); ctx.moveTo(6,8); ctx.lineTo(14,12); ctx.moveTo(14,8); ctx.lineTo(6,12); break;
        case 3: ctx.moveTo(10,2); ctx.lineTo(16,8); ctx.lineTo(10,18); ctx.lineTo(4,8); ctx.closePath(); ctx.moveTo(10,5); ctx.lineTo(10,15); ctx.moveTo(7,9); ctx.lineTo(13,9); break;
        case 4: ctx.moveTo(2,10); ctx.lineTo(18,10); ctx.moveTo(10,2); ctx.lineTo(10,18); ctx.moveTo(4,4); ctx.lineTo(16,16); ctx.moveTo(16,4); ctx.lineTo(4,16); break;
        case 5: ctx.moveTo(10,2); ctx.lineTo(12,6); ctx.lineTo(16,7); ctx.lineTo(13,10); ctx.lineTo(14,14); ctx.lineTo(10,12); ctx.lineTo(6,14); ctx.lineTo(7,10); ctx.lineTo(4,7); ctx.lineTo(8,6); ctx.closePath(); break;
      }
    }

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var area = w * h;
    var COUNT = Math.min(56, Math.max(24, Math.floor(area / 60000)));

    // Non-overlapping, stratified placement similar to the image branch
    var PAD_PCT = 0.06; // 6% edge padding
    var MIN_SIZE = 14;  // px – smaller overall
    var MAX_SIZE = 36;  // px – tight small band
    var PADDING_FACTOR = 0.14; // slightly tighter packing
    var DIAGONAL_FACTOR = 0.70710678; // sqrt(2)/2 for rotated square radius
    var GLOW_MARGIN = 12; // extra pixels to account for glow

    var sizes = [];
    // Bimodal: many small (MIN_SIZE..MAX_SIZE), but significantly more large than before
    var LARGE_MIN = 60, LARGE_MAX = 110; // px for canvas glyphs – increase band
    var maxLargeCap = 10; // allow more large glyphs on fallback
    var desiredLarge = Math.floor(COUNT * 0.35) + 2; // ~35% large + slight boost for 1–2 more big runes
    var largeCount = Math.max(2, Math.min(maxLargeCap, COUNT, desiredLarge));
    var smallCount = Math.max(0, COUNT - largeCount);

    for (var li = 0; li < largeCount; li++) {
      var lt = Math.random();
      sizes.push(LARGE_MIN + (LARGE_MAX - LARGE_MIN) * lt);
    }
    for (var si = 0; si < smallCount; si++) {
      var st = Math.random();
      sizes.push(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * st);
    }
    sizes.sort(function(a,b){ return b - a; });

    var cols = 3, rows = 3;
    var cellW = w / cols, cellH = h / rows;
    var placed = [];

    function canPlace(cx, cy, rPx) {
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        var dx = cx - p.x;
        var dy = cy - p.y;
        var minDist = (rPx + p.r) * (1 + PADDING_FACTOR);
        if (dx*dx + dy*dy < minDist*minDist) return false;
      }
      return true;
    }
    function clamp(v, min, max){ return v < min ? min : (v > max ? max : v); }

    var minX = PAD_PCT * w, maxX = (1 - PAD_PCT) * w;
    var minY = PAD_PCT * h, maxY = (1 - PAD_PCT) * h;

    var sIndex = 0;
    outer2: for (var ry = 0; ry < rows; ry++) {
      for (var cxI = 0; cxI < cols; cxI++) {
        if (sIndex >= sizes.length) break outer2;
        var sizePx = sizes[sIndex];
        var rPx = sizePx * DIAGONAL_FACTOR + GLOW_MARGIN;
        var cx = (cxI + 0.5) * cellW;
        var cy = (ry + 0.5) * cellH;
        cx += rand(-cellW*0.25, cellW*0.25);
        cy += rand(-cellH*0.25, cellH*0.25);
        cx = clamp(cx, minX + rPx, maxX - rPx);
        cy = clamp(cy, minY + rPx, maxY - rPx);
        var attempts = 0, ok = false;
        while (attempts++ < 15) {
          if (canPlace(cx, cy, rPx)) { ok = true; break; }
          cx = clamp((cxI + rand(0.25,0.75)) * cellW, minX + rPx, maxX - rPx);
          cy = clamp((ry  + rand(0.25,0.75)) * cellH, minY + rPx, maxY - rPx);
        }
        if (ok) { placed.push({ x: cx, y: cy, r: rPx, size: sizePx }); sIndex++; }
      }
    }

    while (sIndex < sizes.length) {
      var sPx = sizes[sIndex];
      var rad = sPx * DIAGONAL_FACTOR + GLOW_MARGIN;
      var attempts2 = 0, ok2 = false, px = 0, py = 0;
      while (attempts2++ < 80 && !ok2) {
        px = rand(minX + rad, maxX - rad);
        py = rand(minY + rad, maxY - rad);
        if (canPlace(px, py, rad)) ok2 = true;
      }
      if (!ok2) { sIndex++; continue; }
      placed.push({ x: px, y: py, r: rad, size: sPx });
      sIndex++;
    }

    var runes = [];
    for (var i = 0; i < placed.length; i++) {
      var pl = placed[i];
      var size = pl.size;
      runes.push({
        x: pl.x,
        y: pl.y,
        size: size,
        glyph: (i % 5) + 1,
        rot: rand(0, Math.PI * 2),
        rotSpeed: (rand(-0.5, 0.5)) * (Math.PI / 180) / 2,
        fadePhase: rand(0, Math.PI * 2),
        fadeSpeed: rand(0.02, 0.05)
      });
    }

    var strokeStyle = 'rgba(10,10,10,0.35)';
    var lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    var lastTime = performance.now();
    function drawFrame(now) {
      if (!isLightMode()) return;
      var dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      for (var i = 0; i < runes.length; i++) {
        var r = runes[i];
        var alpha = prefersReduced ? 0.08 : (0.04 + 0.04 * (0.5 + 0.5 * Math.sin(r.fadePhase)));
        r.fadePhase += r.fadeSpeed * dt * 2 * Math.PI;
        if (!prefersReduced) r.rot += r.rotSpeed * dt;
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);
        var s = r.size / 20;
        ctx.scale(s, s);
        ctx.translate(-10, -10);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth / s;
        drawGlyph(ctx, r.glyph);
        ctx.stroke();
        ctx.restore();
      }
      if (!prefersReduced) requestAnimationFrame(drawFrame);
    }

    drawFrame(performance.now());
    if (!prefersReduced) requestAnimationFrame(drawFrame);
    observeTheme(container, function(){ window.removeEventListener('resize', resize); });
  }

  function observeTheme(node, onRemove) {
    var mo = new MutationObserver(function () {
      if (!isLightMode() && node.parentNode) {
        if (onRemove) try { onRemove(); } catch (e) {}
        node.parentNode.removeChild(node);
        mo.disconnect();
      }
    });
    mo.observe(document.documentElement || document.body, { attributes: true, attributeFilter: ['data-bs-theme', 'class'] });
  }

  // Lightweight particles layer (soft purple drifting dots)
  function startParticles() {
    // Tuning constants: adjust to make particles fly more/less
    var SPEED_MAX = 0.55;       // max drift speed in px per frame unit (used with dt*60)
    var ACCEL_NOISE = 0.02;     // random steering per frame (smaller = smoother)
    var BASE_V_RANGE = 0.30;    // initial velocity range (+/-)

    var canvas = document.createElement('canvas');
    canvas.id = 'runeParticles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    // appended first so it stays behind the runes images
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function sizeToViewport() {
      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    sizeToViewport();

    var prefersReduced = false;
    try { prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var particles = [];
    function resetParticles() {
      var w = canvas.width / dpr;
      var h = canvas.height / dpr;
      var area = w * h;
      var COUNT = Math.min(80, Math.max(20, Math.floor(area / 45000)));
      particles = [];
      for (var i = 0; i < COUNT; i++) {
        var sz = Math.random() * 2.2 + 0.6; // 0.6–2.8px
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: sz,
          alpha: Math.random() * 0.14 + 0.06,
          aSpeed: (Math.random() * 0.3 + 0.1) * (Math.random() < 0.5 ? -1 : 1),
          // initial base drift so particles visibly "fly"
          vx: (Math.random() * 2 * BASE_V_RANGE - BASE_V_RANGE),
          vy: (Math.random() * 2 * BASE_V_RANGE - BASE_V_RANGE)
        });
      }
    }

    resetParticles();

    var rafId = 0;
    var last = performance.now();
    function frame(now) {
      var w = canvas.width / dpr, h = canvas.height / dpr;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (!prefersReduced) {
          // gentle steering noise to create meandering flight
          p.vx += (Math.random() * 2 - 1) * ACCEL_NOISE * dt * 60;
          p.vy += (Math.random() * 2 - 1) * ACCEL_NOISE * dt * 60;
          // clamp speed to avoid jumps
          var sp = Math.hypot(p.vx, p.vy);
          if (sp > SPEED_MAX) { p.vx = (p.vx / sp) * SPEED_MAX; p.vy = (p.vy / sp) * SPEED_MAX; }

          // integrate position (scaled by dt)
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          // wrap around
          if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
          if (p.y < -5) p.y = h + 5; else if (p.y > h + 5) p.y = -5;
          // gentle twinkle
          p.alpha += p.aSpeed * dt * 0.2;
          if (p.alpha < 0.04 || p.alpha > 0.24) p.aSpeed *= -1;
        }
        ctx.beginPath();
        // soft purple tint
        ctx.fillStyle = 'rgba(150, 70, 255,' + (prefersReduced ? Math.min(0.18, p.alpha) : p.alpha.toFixed(3)) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!prefersReduced) rafId = requestAnimationFrame(frame);
    }

    frame(performance.now());
    if (!prefersReduced) rafId = requestAnimationFrame(frame);

    function onResize() {
      sizeToViewport();
      resetParticles();
    }
    window.addEventListener('resize', onResize);

    observeTheme(container, function(){
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    });
  }

  // Kick off: start particles, then probe assets for runes, then start images or fallback canvas
  startParticles();
  probeAssets(64).then(function(list){
    if (list && list.length) startImages(list); else startCanvas();
  }).catch(function(){ startCanvas(); });
})();
