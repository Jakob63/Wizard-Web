import { createApp } from 'vue';
import App from './App.vue';

window.INGAME_URL = window.INGAME_URL || '/ingame';
window.start_game = window.start_game || function(){
    try { window.location.href = '/menu'; }
    catch(_) { try { window.location.assign('/menu'); } catch(__) {} }
};

createApp(App).mount('#app');