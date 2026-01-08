(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const retryBtn = document.getElementById('retry');
  const reconnectBtn = document.getElementById('reconnect');

  const GROUND_Y = 160;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -10.5;
  let speed = 4.2;

  const dino = { x: 40, y: GROUND_Y-24, w: 28, h: 24, vy: 0, onGround: true };

  let obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 70;

  // Score
  let score = 0;
  let best = +localStorage.getItem('dino_best') || 0;
  bestEl.textContent = best;

  // State
  let gameOver = false;
  let raf = 0;

  function reset(){
    dino.y = GROUND_Y - dino.h; dino.vy = 0; dino.onGround = true;
    obstacles = [];
    spawnTimer = 0; spawnInterval = 70; speed = 4.2;
    score = 0; gameOver = false;
    cancelAnimationFrame(raf); loop();
  }

  function jump(){
    if (gameOver) { reset(); return; }
    if (dino.onGround) { dino.vy = JUMP_VELOCITY; dino.onGround = false; }
  }

  function spawnObstacle(){
    const height = 20 + Math.floor(Math.random()*18); // 20–38 px
    const width = 10 + Math.floor(Math.random()*14);  // 10–24 px
    obstacles.push({ x: canvas.width + 10, y: GROUND_Y - height, w: width, h: height });
  }

  function aabb(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function step(){
    dino.vy += GRAVITY;
    dino.y += dino.vy;
    if (dino.y >= GROUND_Y - dino.h){ dino.y = GROUND_Y - dino.h; dino.vy = 0; dino.onGround = true; }

    spawnTimer++;
    if (spawnTimer >= spawnInterval){
      spawnObstacle();
      spawnTimer = 0;
      spawnInterval = Math.max(48, 65 + Math.floor(Math.random()*35) - Math.floor(speed));
    }
    for (let i=obstacles.length-1; i>=0; i--){
      obstacles[i].x -= speed;
      if (obstacles[i].x + obstacles[i].w < -10) obstacles.splice(i,1);
    }

    score += 0.1 * speed;
    if (Math.floor(score) % 100 === 0) speed = Math.min(10, speed + 0.02);

    for (const o of obstacles){
      if (aabb(dino, o)) { gameOver = true; break; }
    }

    scoreEl.textContent = Math.floor(score);
    if (gameOver){
      if (Math.floor(score) > best){ best = Math.floor(score); localStorage.setItem('dino_best', best); }
      bestEl.textContent = best;
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,GROUND_Y+0.5); ctx.lineTo(canvas.width,GROUND_Y+0.5); ctx.stroke();

    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(Math.round(dino.x), Math.round(dino.y), dino.w, dino.h);

    if (!gameOver && dino.onGround){
      const t = Date.now() / 120; const s = Math.sin(t);
      ctx.fillStyle = '#cfcfcf';
      ctx.fillRect(Math.round(dino.x + 4), Math.round(dino.y + dino.h - 4), 6, 4 * (s>0?1:0.7));
      ctx.fillRect(Math.round(dino.x + 18), Math.round(dino.y + dino.h - 4), 6, 4 * (s<0?1:0.7));
    }

    ctx.fillStyle = '#7bd45a';
    obstacles.forEach(o => ctx.fillRect(Math.round(o.x), Math.round(o.y), o.w, o.h));

    if (gameOver){
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Space/Neu für Restart', canvas.width/2, 70);
    }

    ctx.fillStyle = '#bbb';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.floor(score)), canvas.width - 8, 18);
  }

  function loop(){
    step();
    draw();
    if (!gameOver) { raf = requestAnimationFrame(loop); }
  }

  window.addEventListener('keydown', (e)=>{
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); jump(); }
    if ((e.code === 'KeyR' || e.key === 'r') && gameOver) reset();
  }, { passive:false });
  canvas.addEventListener('pointerdown', jump);
  retryBtn.addEventListener('click', reset);

  reconnectBtn.addEventListener('click', ()=> location.reload());
  window.addEventListener('online', ()=> location.reload());

  loop();
})();
