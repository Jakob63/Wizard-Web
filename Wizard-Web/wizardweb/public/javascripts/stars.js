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
      // for (let i = 0; i < 10; i++) { /* hier käme Code rein */ }

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
    starDensity: 0.0014, // Anzahl Sterne pro Pixel (0.0014 ist moderat). Größer = dichter Himmel.
    minSize: 0.6,        // kleinster Sternradius (in Pixeln)
    maxSize: 1.8,        // größter Sternradius
    minSpeed: 0.02,      // langsamster Stern (Pixel pro Frame)
    maxSpeed: 0.6,       // schnellster Stern
    twinkleChance: 0.02, // Wahrscheinlichkeit pro Frame, dass ein Stern leicht flackert
    parallax: 0.12       // wie stark sich Sterne bei Mausbewegung verschieben (Parallaxe)
  };

  // 5) Interne Zustände
  let width = 0;     // aktuelle Canvas-Breite in CSS-Pixeln
  let height = 0;    // aktuelle Canvas-Höhe in CSS-Pixeln
  let stars = [];    // Liste aller Sterne (jedes Element ist ein Objekt)
  let mouseX = 0.5;  // Mausposition normalisiert (0..1) – 0.5 = Mitte
  let mouseY = 0.5;

  // 6) Hilfsfunktionen
  function rand(min, max) {
    // Liefert eine Zufallszahl zwischen min (inkl.) und max (exkl.).
    return Math.random() * (max - min) + min;
  }

  function resizeCanvas() {
    // Größe des Canvas an die Größe des Browserfensters anpassen
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    // Für Schärfe: physische Pixelgröße = CSS-Pixel * DPR
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);

    // Im Zeichenkontext skalieren, damit 1 Einheit = 1 CSS-Pixel ist
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Nach Größenänderung: Sterne neu erzeugen
    createStars();
  }

  function createStars() {
    // Berechne die Anzahl Sterne basierend auf der Fläche (Breite*Höhe) und der Dichte
    const count = Math.floor(width * height * SETTINGS.starDensity);
    stars = []; // Liste leeren

    for (let i = 0; i < count; i++) {
      // Jeder Stern hat:
      // - x, y: Position (Pixel)
      // - size: Radius
      // - speed: vertikale Geschwindigkeit (je größer, desto schneller)
      // - alpha: Transparenz (0..1)
      // - twinkleDir: Richtung des Flackerns (+1 oder -1)
      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        size: rand(SETTINGS.minSize, SETTINGS.maxSize),
        speed: rand(SETTINGS.minSpeed, SETTINGS.maxSpeed),
        alpha: rand(0.5, 1),
        twinkleDir: Math.random() < 0.5 ? -1 : 1
      });
    }
  }

  function drawBackgroundGradient() {
    // Optionaler, sehr dezenter Farbverlauf im Hintergrund –
    // macht den Himmel lebendiger, falls das CSS-Gradient nicht greift.
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#0b0d12");
    g.addColorStop(1, "#020308");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function updateAndDrawStars() {
    // Parallax-Offset: verschiebt Sterne leicht zur Maus, tiefer = weniger parallax
    const offsetX = (mouseX - 0.5) * SETTINGS.parallax * width;
    const offsetY = (mouseY - 0.5) * SETTINGS.parallax * height;

    // Sterne nacheinander updaten und zeichnen
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      // Y-Position erhöhen: s.y = s.y + s.speed
      s.y += s.speed;

      // Wenn ein Stern unten aus dem Bild fällt, oben neu erscheinen lassen
      if (s.y - s.size > height) {
        s.y = -s.size;          // wieder oben starten
        s.x = rand(0, width);   // zufällige X-Position
        s.speed = rand(SETTINGS.minSpeed, SETTINGS.maxSpeed);
        s.size = rand(SETTINGS.minSize, SETTINGS.maxSize);
      }

      // Twinkle/Flackern: Alpha (Transparenz) leicht rauf/runter bewegen
      if (Math.random() < SETTINGS.twinkleChance) {
        // Richtung zufällig umkehren (mit 50% Chance)
        if (Math.random() < 0.5) s.twinkleDir *= -1; // *= ist Kurzform für: s.twinkleDir = s.twinkleDir * -1
      }
      s.alpha += s.twinkleDir * 0.01; // 0.01 = kleine Stufe
      // Grenzen setzen, damit alpha zwischen 0.3 und 1 bleibt
      if (s.alpha > 1) { s.alpha = 1; s.twinkleDir = -1; }
      if (s.alpha < 0.3) { s.alpha = 0.3; s.twinkleDir = 1; }

      // Stern zeichnen – Kreis mit weichem Schein (Radial-Gradient)
      const gradient = ctx.createRadialGradient(s.x + offsetX, s.y + offsetY, 0, s.x + offsetX, s.y + offsetY, s.size * 2);
      gradient.addColorStop(0, `rgba(255,255,255,${(0.8 * s.alpha).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x + offsetX, s.y + offsetY, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame() {
    // Ein Frame = Bildschirm neu zeichnen.
    // 1) Hintergrund (sehr dezent)
    drawBackgroundGradient();
    // 2) Sterne updaten und zeichnen
    updateAndDrawStars();
    // 3) Nächstes Frame planen
    requestAnimationFrame(frame);
  }

  // 7) Mausbewegungen für Parallax-Effekt mitlesen
  window.addEventListener("mousemove", (ev) => {
    // clientX/Y ist Pixelposition innerhalb des sichtbaren Bereichs
    mouseX = ev.clientX / (width || 1); // geteilt durch Breite -> 0..1
    mouseY = ev.clientY / (height || 1);
  });

  // 8) Wenn sich die Fenstergröße ändert, Canvas neu anpassen
  window.addEventListener("resize", resizeCanvas);

  // 9) Start – wenn DOM fertig ist, initialisieren
  // Wir prüfen, ob das Dokument bereits "bereit" ist. Da das Script mit defer geladen wird,
  // sollte es nach dem Parsen des HTML ausgeführt werden. Zur Sicherheit nutzen wir dennoch
  // requestAnimationFrame, um mindestens einen Tick zu warten, bis Styles angewandt sind.
  requestAnimationFrame(() => {
    resizeCanvas(); // setzt Größe + erzeugt Sterne
    frame();        // startet die Animation
  });
})();
