(function () {
  let canvas = document.getElementById("starfield");
  if (!canvas) {
    return;
  }

  let ctx = canvas.getContext("2d");

  let DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  let SETTINGS = {
    starDensity: 0.00075,
    minSize: 0.6,
    maxSize: 1.8,
    minSpeed: 0.02,
    maxSpeed: 0.6,
    twinkleChance: 0.02,
    parallax: 0,

    specialDensity: 0.00001,
    specialMinSize: 2.2,
    specialMaxSize: 3.8,
    specialTwinkleBoost: 0.02
  };

  // jQuery AJAX -> native Promise wrapper
  function ajaxJson(routeOrUrl, options = {}) {
    return new Promise((resolve, reject) => {
      let $ = window.jQuery;
      if ($ && $.ajax) {
        $.ajax({
          url: typeof routeOrUrl === 'string' ? routeOrUrl : (routeOrUrl && routeOrUrl.url),
          method: typeof routeOrUrl === 'string' ? (options.method || 'GET') : (routeOrUrl && routeOrUrl.type) || 'GET',
          dataType: 'json',
          data: options.data,
          timeout: options.timeout || 12000,
          success: (data) => resolve(data),
          error: (jqXHR, status, error) => {
            let err = new Error(error || status || 'AJAX error');
            err.status = jqXHR && jqXHR.status;
            err.responseJSON = jqXHR && jqXHR.responseJSON;
            err.responseText = jqXHR && jqXHR.responseText;
            reject(err);
          }
        });
      } else {
        // Fallback: resolve immediately without changing settings
        resolve(null);
      }
    });
  }

  // Merge server-provided settings into local SETTINGS (whitelist keys)
  function mergeSettings(from) {
    if (!from || typeof from !== 'object') return;
    let allowed = [
      'starDensity','minSize','maxSize','minSpeed','maxSpeed',
      'twinkleChance','parallax','specialDensity','specialMinSize',
      'specialMaxSize','specialTwinkleBoost'
    ];
    allowed.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(from, k)) {
        SETTINGS[k] = from[k];
      }
    });
  }

  // Try to load optional star settings via jsRoutes or static JSON
  async function loadStarSettings() {
    try {
      if (window.jsRoutes && jsRoutes.controllers && jsRoutes.controllers.HomeController && jsRoutes.controllers.HomeController.starSettings) {
        let route = jsRoutes.controllers.HomeController.starSettings();
        let data = await ajaxJson(route);
        mergeSettings(data);
        return;
      }
    } catch (e) { /* ignore and try static */ }

    try {
      // Try a static asset if available
      let data = await ajaxJson('/assets/config/stars.json');
      mergeSettings(data);
    } catch (e2) {
      // No settings available; keep defaults
    }
  }

  let width = 0;
  let height = 0;
  let stars = [];
  let mouseX = 0.5;
  let mouseY = 0.5;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resizeCanvas() {
    let rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    createStars();
  }

  function createStars() {
    let count = Math.floor(width * height * SETTINGS.starDensity);
    let specialCount = Math.max(1, Math.floor(width * height * SETTINGS.specialDensity));
    stars = [];

    // kleine sterne
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        size: rand(SETTINGS.minSize, SETTINGS.maxSize),
        speed: rand(SETTINGS.minSpeed, SETTINGS.maxSpeed),
        alpha: rand(0.5, 1),
        twinkleDir: Math.random() < 0.5 ? -1 : 1,
        isSpecial: false
      });
    }

    for (let i = 0; i < specialCount; i++) {
      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        size: rand(SETTINGS.specialMinSize, SETTINGS.specialMaxSize),
        speed: rand(SETTINGS.minSpeed * 0.5, SETTINGS.maxSpeed * 0.75),
        alpha: rand(0.6, 1),
        twinkleDir: Math.random() < 0.5 ? -1 : 1,
        isSpecial: true
      });
    }
  }

  function drawBackgroundGradient() {
    let g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#0b0d12");
    g.addColorStop(1, "#020308");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function updateAndDrawStars() {
    let offsetX = 0;
    let offsetY = 0;

    // Sterne nacheinander updaten und zeichnen
    for (let i = 0; i < stars.length; i++) {
      let s = stars[i];

      if (Math.random() < SETTINGS.twinkleChance) {
        if (Math.random() < 0.5) s.twinkleDir *= -1;
      }
      let twinkleStep = s.isSpecial ? (0.012 + SETTINGS.specialTwinkleBoost) : 0.012;
      s.alpha += s.twinkleDir * twinkleStep;
      if (s.alpha > 0.95) { s.alpha = 0.95; s.twinkleDir = -1; }
      if (s.alpha < 0.06) {
        s.x = rand(0, width);
        s.y = rand(0, height);
        if (s.isSpecial) {
          s.size = rand(SETTINGS.specialMinSize, SETTINGS.specialMaxSize);
        } else {
          s.size = rand(SETTINGS.minSize, SETTINGS.maxSize);
        }
        s.alpha = rand(0.06, 0.18);
        s.twinkleDir = 1;
      }

      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.shadowColor = "rgba(255,255,255,0.6)";

      if (s.isSpecial) {
        let glowRadius = s.size * 3;
        let cx = s.x + offsetX;
        let cy = s.y + offsetY;
        let gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, `rgba(255,255,255,${(0.85 * s.alpha).toFixed(3)})`);
        gradient.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.shadowBlur = s.size * 3;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, s.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        let cx = s.x + offsetX;
        let cy = s.y + offsetY;
        let glowRadius = s.size * 2;
        let gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, `rgba(255,255,255,${(0.85 * s.alpha).toFixed(3)})`);
        gradient.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.shadowBlur = s.size * 1.8;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function frame() {
    drawBackgroundGradient();
    updateAndDrawStars();
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize", resizeCanvas);

  // Bootstrap: load optional remote settings before starting animation
  (async () => {
    try { await loadStarSettings(); } catch(e) { /* keep defaults */ }
    requestAnimationFrame(() => {
      resizeCanvas();
      frame();
    });
  })();
})();
