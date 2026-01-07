<template>
  <main class="home-hero">
    <h1>Starting the game …</h1>
    <p>Please wait a moment.</p>

    <p class="mt-3">
      <button class="btn btn-primary" @click="goToTarget">
        Continue
      </button>
    </p>
  </main>
</template>

<script>
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'LoadingPage',

  props: {
    refreshUrl: { type: String, default: '' },
    delayMs: { type: Number, default: 800 }
  },

  setup(props) {
    const router = useRouter();
    const route = useRoute();

    let timerId = null;

    const targetUrl = () => {
      // Priorität:
      // 1. prop refreshUrl
      // 2. query ?to=
      // 3. query ?url=
      // 4. global window.INGAME_URL
      // 5. fallback /ingame
      return (
          props.refreshUrl ||
          route.query.to ||
          route.query.url ||
          window.INGAME_URL ||
          '/ingame'
      );
    };

    const goToTarget = () => {
      const target = targetUrl();
      if (!target) return;

      // echtes SPA-Routing
      router.push(target).catch(() => {
        // Fallback NUR wenn Router wirklich scheitert
        window.location.assign(target);
      });
    };

    const startTimer = () => {
      const delay = Math.max(0, Number(props.delayMs) || 0);
      timerId = setTimeout(goToTarget, delay);
    };

    const clearTimer = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    return {
      goToTarget,
      startTimer,
      clearTimer
    };
  },

  mounted() {
    this.startTimer();
  },

  beforeUnmount() {
    this.clearTimer();
  }
};
</script>

<style lang="less" scoped>
@import "../../../app/assets/stylesheets/home.less";

.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
  }

  .btn-primary {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
  }
}
</style>
