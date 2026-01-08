<template>
  <div id="shell">
    <MainPage>
      <router-view />
    </MainPage>
  </div>
</template>

<script>
import MainPage from './components/MainPage.vue';

export default {
  name: 'App',
  components: { MainPage }
};
</script>

<style>
#shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
