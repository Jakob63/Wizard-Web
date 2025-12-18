<template>
  <main id="rules-vue-root" class="rules">
    <h1>Wizard – Spielregeln</h1>

    <section>
      <h2 @click="toggle('ziel')">Spielziel</h2>
      <p v-show="open.ziel">Das Ziel des Spiels ist es, möglichst genau vorherzusagen, wie viele Stiche man in jeder Runde machen wird. Für jede richtige Vorhersage gibt es Punkte.</p>
    </section>

    <section>
      <h2 @click="toggle('material')">Spielmaterial</h2>
      <ul v-show="open.material">
        <li>60 Karten (13 Karten pro Farbe: rot, gelb, grün, blau, + 4 Zauberer, 4 Narren)</li>
      </ul>
    </section>

    <section>
      <h2 @click="toggle('spieler')">Spieleranzahl</h2>
      <p v-show="open.spieler">3–6 Spieler</p>
    </section>

    <section>
      <h2 @click="toggle('ablauf')">Spielablauf</h2>
      <ol v-show="open.ablauf">
        <li>Das Spiel besteht aus mehreren Runden. In der ersten Runde bekommt jeder Spieler 1 Karte, in der zweiten 2 Karten, usw. – bis alle Karten aufgebraucht sind.</li>
        <li>In jeder Runde wird eine Trumpffarbe bestimmt (die Karte vom Nachziehstapel wird aufgedeckt). Ist es ein Zauberer, sucht sich der Spieler <strong>links vom Dealer</strong> den Trumpf für die Runde aus. Ist es ein Narr, gibt es <strong>keinen Trumpf</strong>.</li>
        <li>Jeder Spieler sagt reihum voraus, wie viele Stiche er in dieser Runde machen wird.</li>
        <li>Dann wird gespielt: Im Uhrzeigersinn spielt jeder eine Karte aus. Die Farbe der ersten Karte muss bedient werden. Wenn man keine Karte der geforderten Farbe hat, darf man eine beliebige Karte spielen.</li>
        <li>Der höchste Trumpf gewinnt den Stich. Falls kein Trumpf gespielt wurde, gewinnt die höchste Karte der angespielten Farbe. Zauberer sind immer am höchsten, Narren am niedrigsten.</li>
      </ol>
    </section>

    <section>
      <h2 @click="toggle('rang')">Kartenrangfolge</h2>
      <ul v-show="open.rang">
        <li><strong>Zauberer</strong> (höchste Karte, sticht immer – es sei denn, ein anderer Zauberer wurde zuerst gespielt)</li>
        <li>Normale Zahlenkarten (1–13, nach Farbe sortiert)</li>
        <li><strong>Narr</strong> (wertlos, gewinnt nie einen Stich – es sei denn, es wurden nur Narren gespielt)</li>
      </ul>
    </section>

    <section>
      <h2 @click="toggle('punkte')">Punktevergabe</h2>
      <ul v-show="open.punkte">
        <li>Richtige Vorhersage: 20 Punkte + 10 Punkte pro gemachtem Stich</li>
        <li>Falsche Vorhersage: -10 Punkte pro Abweichung (z. B. 2 gesagt, aber 0 gemacht = -20 Punkte)</li>
      </ul>
    </section>

    <section>
      <h2 @click="toggle('ende')">Spielende</h2>
      <p v-show="open.ende">Das Spiel endet nach der Runde, in der alle Karten verteilt wurden (je nach Spieleranzahl unterschiedlich viele Runden). Der Spieler mit den meisten Punkten gewinnt.</p>
    </section>

    <section>
      <h2 @click="toggle('hinweise')">Besondere Hinweise</h2>
      <ul v-show="open.hinweise">
        <li>Zauberer darf jederzeit gespielt werden.</li>
        <li>Narr darf ebenfalls jederzeit gespielt werden.</li>
        <li>Wenn der erste Spieler eines Stichs einen Zauberer spielt, bestimmt die nächste Karte die Farbe, die bedient werden muss.</li>
      </ul>
    </section>

    <!-- Anleitungsvideo (am Seitenende) -->
    <section aria-label="Anleitungsvideo" style="display:flex; justify-content:center; margin: 24px 0;">
      <!-- Der gewünschte Short: https://www.youtube.com/shorts/6jVsRzdVbUA -->
      <lite-youtube ref="yt" videoid="6jVsRzdVbUA" style="max-width:560px; display:block;"></lite-youtube>
    </section>

    </main>
</template>

<script>
export default {
  name: 'RulesPage',
  mounted(){
    // Lade die Web-Komponente und ihr CSS einmalig, damit die Vorschau sichtbar ist
    try {
      // Preconnects für bessere Ladezeit (optional)
      if (!document.querySelector('link[data-preconnect-yt]')) {
        const p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://www.youtube.com'; p1.setAttribute('data-preconnect-yt','1'); document.head.appendChild(p1);
        const p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://i.ytimg.com'; p2.setAttribute('data-preconnect-yt','1'); document.head.appendChild(p2);
      }
      if (!document.querySelector('script[data-lite-yt]')) {
        const s = document.createElement('script');
        s.type = 'module';
        s.src = 'https://cdn.jsdelivr.net/npm/lite-youtube-embed@0.3.3/src/lite-yt-embed.js';
        s.setAttribute('data-lite-yt','1');
        document.head.appendChild(s);
      }
      if (!document.querySelector('link[data-lite-yt-css]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://cdn.jsdelivr.net/npm/lite-youtube-embed@0.3.3/src/lite-yt-embed.css';
        l.setAttribute('data-lite-yt-css','1');
        document.head.appendChild(l);
      }
      // Fallback: falls die Web-Komponente nach kurzer Zeit nicht definiert ist,
      // ersetzen wir das Element durch ein normales YouTube-iframe.
      const ensureVisibleFallback = () => {
        try {
          const el = this.$refs.yt || document.querySelector('lite-youtube[videoid]');
          if (!el) return;
          // Wenn Custom Element nicht definiert ODER Element hat keine sichtbare Größe, ersetze durch iframe
          const tagDefined = !!(window.customElements && customElements.get('lite-youtube'));
          const rect = (typeof el.getBoundingClientRect === 'function') ? el.getBoundingClientRect() : { width: 0, height: 0 };
          const tooSmall = !rect || rect.width < 10 || rect.height < 10;
          if (tagDefined && !tooSmall) return; // alles gut
          const vid = el.getAttribute('videoid') || '6jVsRzdVbUA';
          const iframe = document.createElement('iframe');
          iframe.width = '560';
          iframe.height = '315';
          iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(vid)}?rel=0`;
          iframe.title = 'YouTube video player';
          iframe.frameBorder = '0';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          iframe.allowFullscreen = true;
          el.replaceWith(iframe);
        } catch(_) {}
      };
      // zwei Versuche zeitversetzt, um langsames Laden zu berücksichtigen
      setTimeout(ensureVisibleFallback, 1200);
      setTimeout(ensureVisibleFallback, 2500);
    } catch(_) {}
  },
  data(){
    return {
      open: {
        ziel: true,
        material: true,
        spieler: true,
        ablauf: true,
        rang: true,
        punkte: true,
        ende: true,
        hinweise: true
      }
    };
  },
  methods: {
    toggle(key){
      if (this.open && Object.prototype.hasOwnProperty.call(this.open, key)) {
        this.open[key] = !this.open[key];
      }
    }
  }
}
</script>

<style scoped>
/* Provide comfortable spacing from the fixed navbar */
main.rules { padding: 72px .75rem 1rem; }
.title { font-weight: 600; }
h2 { cursor: pointer; }
</style>
