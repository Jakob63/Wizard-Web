import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

window.INGAME_URL = window.INGAME_URL || '/ingame';
window.start_game = window.start_game || function () {
    router.push('/menu');
};

createApp(App)
    .use(router)
    .mount('#app');
