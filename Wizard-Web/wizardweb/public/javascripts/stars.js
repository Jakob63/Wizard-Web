/*
  Sternen-Hintergrund in reinem JavaScript – extra ausführlich kommentiert.
  Ziel: Ein animierter Sternenhimmel als Canvas-Hintergrund auf der ganzen Seite.

  Hinweise für totale Einsteiger:innen in JavaScript:
  - Variablen: Mit "const" (konstant) und "let" (veränderbar) definierst du Namen.
      const a = 5;   // a ist 5 und bleibt so
      let b = 3;     // b ist 3 und kann später geändert werden

  - Datentypen: Zahl (Number), Text (String), Wahr/Falsch (Boolean), Objekt (Object), Liste (Array) u.a.

  - Operatoren (häufig benutzt):
      +   Addition oder String-Verkettung (z.B. 1 + 2 = 3, "a" + "b" = "ab")
      -   Subtraktion
      *   Multiplikation
      /   Division
      %   Rest bei Division (Modulo), z.B. 7 % 3 = 1
      =   Zuweisung (setzt einen Wert), z.B. b = 10
      ==  Vergleich ohne strengen Typvergleich (meist vermeiden)
      === Vergleich mit strengem Typvergleich (empfohlen), z.B. 2 === 2 ist true
      !== Ungleich (streng)
      <, >, <=, >=  Größer/Kleiner…
      &&  Logisches UND (beide müssen wahr sein)
      ||  Logisches ODER (mindestens eins ist wahr)
      !   Logische Negation (kehrt wahr/falsch um)

  - Funktionen: Wiederverwendbare Codeblöcke.
      function add(x, y) { return x + y; }

  - Objekte: Sammlung von Eigenschaften.
      const stern = { x: 10, y: 20, speed: 1.5 };

  - Arrays (Listen): Geordnete Menge.
      const liste = [1, 2, 3];

  - Schleifen: Wiederhole Code mehrfach.
      // Beispiel-Schleife: wiederholt den Block 10-mal
      // for (let i = 0; i < 10; i++) { // hier käme Code rein }

  Keine Sorge: Im folgenden Code liest du Kommentare direkt neben jedem Schritt.
*/

(function () {
  // 1) Canvas-Element finden
  // Wir erwarten in der HTML-Datei ein <canvas id="starfield"></canvas> (siehe main.scala.html)
  const canvas = document.getElementById("starfield");
  if (!canvas) {
    // Falls kein Canvas existiert, beenden wir das Skript.
    return;
  }

  // 2) 2D-Zeichenkontext vom Canvas holen – damit zeichnen wir die Sterne.
  const ctx = canvas.getContext("2d");

  // 3) Geräteskalierung (für scharfe Darstellung auf Retina/HiDPI)
  // devicePixelRatio ist z.B. 2 bei Retina-Displays, sonst typischerweise 1.
  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  // 4) Einstellungen für den Sternenhimmel – du kannst damit das Aussehen ändern
  const SETTINGS = {
    starDensity: 0.00075,
    minSize: 0.6,
    maxSize: 1.8,
    minSpeed: 0.02,
    maxSpeed: 0.6,
    twinkleChance: 0.02,
    parallax: 0,

    // paar größere sterne
    specialDensity: 0.00001, // seltenheit
    specialMinSize: 2.2,
    specialMaxSize: 3.8,
    specialTwinkleBoost: 0.02
  };

  // Intern
  let width = 0;
  let height = 0;
  let stars = [];
  let mouseX = 0.5;
  let mouseY = 0.5;

  function rand(min, max) {
    // zufallsgröße
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
    // max anzahl sterne beobachten
    const count = Math.floor(width * height * SETTINGS.starDensity);
    const specialCount = Math.max(1, Math.floor(width * height * SETTINGS.specialDensity));
    stars = [];

    // normale
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

    // bissl mehr als normal
    for (let i = 0; i < specialCount; i++) {
      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        size: rand(SETTINGS.specialMinSize, SETTINGS.specialMaxSize),
        // etwas langsamere Bewegung, damit sie "präsenter" wirken
        speed: rand(SETTINGS.minSpeed * 0.5, SETTINGS.maxSpeed * 0.75),
        alpha: rand(0.6, 1),
        twinkleDir: Math.random() < 0.5 ? -1 : 1,
        isSpecial: true
      });
    }
  }

  function drawBackgroundGradient() {
    // if CSS Gradient nicht greift
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#0b0d12");
    g.addColorStop(1, "#020308");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function updateAndDrawStars() {
    // Parallax-Offset: veschiebung zur maus
    const offsetX = 0.00001 * mouseX * SETTINGS.parallax;
    const offsetY = 0.00001 * mouseY * SETTINGS.parallax;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      if (Math.random() < SETTINGS.twinkleChance) {
        // richtung drehen -> 50% Chance
        if (Math.random() < 0.5) s.twinkleDir *= -1;
      }
      const twinkleStep = s.isSpecial ? (0.012 + SETTINGS.specialTwinkleBoost) : 0.012;
      s.alpha += s.twinkleDir * twinkleStep;
      // Obere Grenze: kurz vorm Maximum umkehren -> damit wieder rausfaden
      if (s.alpha > 0.95) { s.alpha = 0.95; s.twinkleDir = -1; }
      // Untere Grenze: selbe geschichte nur anders herum
      if (s.alpha < 0.06) {
        s.x = rand(0, width);
        s.y = rand(0, height);
        if (s.isSpecial) {
          s.size = rand(SETTINGS.specialMinSize, SETTINGS.specialMaxSize);
        } else {
          s.size = rand(SETTINGS.minSize, SETTINGS.maxSize);
        }
        s.alpha = rand(0.06, 0.18); // soft appearen
        s.twinkleDir = 1;           // heller werden
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

  // 7) Mausbewegungen waren für Parallax gedacht – deaktiviert, damit sich nichts mit der Maus bewegt
   window.addEventListener("mousemove", (ev) => {
     mouseX = ev.clientX / (width || 1);
     mouseY = ev.clientY / (height || 1);
   });

  window.addEventListener("resize", resizeCanvas);
  // erst html laden
  requestAnimationFrame(() => {
    resizeCanvas();
    frame();
  });
})();
