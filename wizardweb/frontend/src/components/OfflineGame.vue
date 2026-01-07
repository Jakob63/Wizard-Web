<template>
  <div class="offline-game">
    <div class="bar">
      <h2>Offline – Chrome Dino Mini</h2>
      <div class="hint">Leertaste = Springen</div>
      <button class="btn" @click="reset">Neu</button>
      <button class="btn" @click="$emit('close')">Schließen</button>
    </div>

    <canvas ref="canvas" width="640" height="200" aria-label="Dino Runner"></canvas>

    <div class="bar" style="margin-top:6px">
      <div>Score: <span>{{ scoreRounded }}</span> · Best: <span>{{ best }}</span></div>
      <button class="btn" @click="reconnect">Erneut verbinden</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OfflineGame',
  emits: ['close'],

  data() {
    return {
      ctx: null,
      GROUND_Y: 160,
      GRAVITY: 0.6,
      JUMP_VELOCITY: -10.5,
      speed: 4.2,
      dino: { x: 40, y: 0, w: 28, h: 24, vy: 0, onGround: true },
      obstacles: [],
      spawnTimer: 0,
      spawnInterval: 70,
      score: 0,
      best: 0,
      gameOver: false,
      raf: null,
      keyHandler: null,
      pointerHandler: null
    };
  },

  computed: {
    scoreRounded() { return Math.floor(this.score); }
  },

  mounted() {
    const canvas = this.$refs.canvas;
    this.ctx = canvas.getContext('2d');
    this.dino.y = this.GROUND_Y - this.dino.h;

    try { this.best = +localStorage.getItem('dino_best') || 0; } catch (_) {}

    // Event-Handler
    this.keyHandler = e => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); this.jump(); }
      if ((e.code === 'KeyR' || e.key === 'r') && this.gameOver) this.reset();
    };

    this.pointerHandler = () => this.jump();

    window.addEventListener('keydown', this.keyHandler, { passive: false });
    canvas.addEventListener('pointerdown', this.pointerHandler);
    window.addEventListener('online', this.reconnect);

    this.loop();
  },

  beforeUnmount() {
    cancelAnimationFrame(this.raf);
    const canvas = this.$refs.canvas;
    window.removeEventListener('keydown', this.keyHandler);
    if (canvas) canvas.removeEventListener('pointerdown', this.pointerHandler);
    window.removeEventListener('online', this.reconnect);
  },

  methods: {
    reconnect() {
      // SPA-kompatibel
      if (this.$router) this.$router.go(0);
      else window.location.reload();
    },

    reset() {
      this.dino.y = this.GROUND_Y - this.dino.h;
      this.dino.vy = 0;
      this.dino.onGround = true;
      this.obstacles = [];
      this.spawnTimer = 0;
      this.spawnInterval = 70;
      this.speed = 4.2;
      this.score = 0;
      this.gameOver = false;
      cancelAnimationFrame(this.raf);
      this.loop();
    },

    jump() {
      if (this.gameOver) { this.reset(); return; }
      if (this.dino.onGround) { this.dino.vy = this.JUMP_VELOCITY; this.dino.onGround = false; }
    },

    spawnObstacle() {
      const height = 20 + Math.floor(Math.random() * 18);
      const width = 10 + Math.floor(Math.random() * 14);
      const canvas = this.$refs.canvas;
      this.obstacles.push({ x: canvas.width + 10, y: this.GROUND_Y - height, w: width, h: height });
    },

    aabb(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },

    step() {
      const d = this.dino;
      d.vy += this.GRAVITY;
      d.y += d.vy;
      if (d.y >= this.GROUND_Y - d.h) { d.y = this.GROUND_Y - d.h; d.vy = 0; d.onGround = true; }

      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnObstacle();
        this.spawnTimer = 0;
        this.spawnInterval = Math.max(48, 65 + Math.floor(Math.random() * 35) - Math.floor(this.speed));
      }

      this.obstacles.forEach((o, i) => {
        o.x -= this.speed;
        if (o.x + o.w < -10) this.obstacles.splice(i, 1);
      });

      this.score += 0.1 * this.speed;
      if (Math.floor(this.score) % 100 === 0) this.speed = Math.min(10, this.speed + 0.02);

      for (const o of this.obstacles) {
        if (this.aabb(this.dino, o)) { this.gameOver = true; break; }
      }

      if (this.gameOver && Math.floor(this.score) > this.best) {
        this.best = Math.floor(this.score);
        try { localStorage.setItem('dino_best', this.best); } catch (_) {}
      }
    },

    draw() {
      const ctx = this.ctx;
      const canvas = this.$refs.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Hintergrund
      ctx.fillStyle = '#0e0e0e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bodenlinie
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.GROUND_Y + 0.5);
      ctx.lineTo(canvas.width, this.GROUND_Y + 0.5);
      ctx.stroke();

      // Dino
      ctx.fillStyle = '#e6e6e6';
      ctx.fillRect(Math.round(this.dino.x), Math.round(this.dino.y), this.dino.w, this.dino.h);

      // Beine Animation
      if (!this.gameOver && this.dino.onGround) {
        const t = Date.now() / 120;
        const s = Math.sin(t);
        ctx.fillStyle = '#cfcfcf';
        ctx.fillRect(Math.round(this.dino.x + 4), Math.round(this.dino.y + this.dino.h - 4), 6, 4 * (s > 0 ? 1 : 0.7));
        ctx.fillRect(Math.round(this.dino.x + 18), Math.round(this.dino.y + this.dino.h - 4), 6, 4 * (s < 0 ? 1 : 0.7));
      }

      // Hindernisse
      ctx.fillStyle = '#7bd45a';
      this.obstacles.forEach(o => ctx.fillRect(Math.round(o.x), Math.round(o.y), o.w, o.h));

      // Game Over Overlay
      if (this.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over – Restart', canvas.width / 2, 70);
      }

      // Score
      ctx.fillStyle = '#bbb';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.floor(this.score)), canvas.width - 8, 18);
    },

    loop() {
      this.step();
      this.draw();
      this.raf = requestAnimationFrame(this.loop);
      if (this.gameOver) cancelAnimationFrame(this.raf);
    }
  }
};
</script>

<style scoped>
.offline-game { width: min(640px, 95vw); margin: 0 auto; }
.bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.btn { background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.hint { font-size: .9rem; color: #aaa; }
canvas { width: 100%; height: auto; background: linear-gradient(#1b1b1b, #121212); border: 1px solid #333; border-radius: 8px; image-rendering: pixelated; }
</style>
