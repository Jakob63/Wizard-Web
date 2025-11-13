(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");

  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  const SETTINGS = {
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

  let width = 0;
  let height = 0;
  let stars = [];
  let mouseX = 0.5;
  let mouseY = 0.5;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    createStars();
  }

  function createStars() {
    const count = Math.floor(width * height * SETTINGS.starDensity);
    const specialCount = Math.max(1, Math.floor(width * height * SETTINGS.specialDensity));
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
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#0b0d12");
    g.addColorStop(1, "#020308");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function updateAndDrawStars() {
    const offsetX = 0;
    const offsetY = 0;

    // Sterne nacheinander updaten und zeichnen
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      if (Math.random() < SETTINGS.twinkleChance) {
        if (Math.random() < 0.5) s.twinkleDir *= -1;
      }
      const twinkleStep = s.isSpecial ? (0.012 + SETTINGS.specialTwinkleBoost) : 0.012;
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
        const glowRadius = s.size * 3;
        const cx = s.x + offsetX;
        const cy = s.y + offsetY;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, `rgba(255,255,255,${(0.85 * s.alpha).toFixed(3)})`);
        gradient.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.shadowBlur = s.size * 3;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, s.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const cx = s.x + offsetX;
        const cy = s.y + offsetY;
        const glowRadius = s.size * 2;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
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

  requestAnimationFrame(() => {
    resizeCanvas();
    frame();
  });
})();
