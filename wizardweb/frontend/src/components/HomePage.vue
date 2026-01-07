<template>
  <main class="home-hero">
    <div class="starry-sky" aria-hidden="true">
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star star--big"></span>
      <span class="star"></span>
      <span class="star"></span>
      <span class="star"></span>
    </div>
    <h1 class="home-hero__title" data-text="Wizard">Wizard</h1>
    <div class="home-cta">
      <a class="btn btn-outline-primary btn-lg" href="#" @click.prevent="start">Start Game</a>
    </div>
  </main>
  </template>

<script>
export default {
  name: 'HomePage',
  methods: {
    start(){
      try {
        if (typeof window.start_game === 'function') { window.start_game(); return; }
        window.location.href = '/menu';
        return;
      } catch(_) {}
      try { window.location.href = '/menu'; } catch(_) {}
    }
  },
  mounted(){
    try {
      const stars = this.$el.querySelectorAll('.starry-sky .star');
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const rerollStar = (star, alsoTiming = false, alsoSize = false) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        star.style.left = left.toFixed(2) + '%';
        star.style.top = top.toFixed(2) + '%';
        if (alsoTiming) {
          const duration = (Math.random() * 2.2 + 2.2).toFixed(2) + 's';
          const delay = (Math.random() * 2.0).toFixed(2) + 's';
          star.style.setProperty('--twinkle-duration', duration);
          star.style.animationDelay = delay;
        }
        if (alsoSize) {
          const min = star.classList.contains('star--big') ? 3.0 : 1.2;
          const max = star.classList.contains('star--big') ? 4.2 : 2.8;
          const size = (Math.random() * (max - min) + min).toFixed(2) + 'px';
          star.style.setProperty('--star-size', size);
        }
      };
      stars.forEach((star) => {
        rerollStar(star, true, true);
        if (prefersReduced) {
          star.style.animation = 'none';
          star.style.opacity = '.4';
          return;
        }
        star.addEventListener('animationiteration', () => rerollStar(star));
      });
    } catch(e) { }
  }
}
</script>

<style lang="less">
@import "../../../app/assets/stylesheets/home.less";
</style>