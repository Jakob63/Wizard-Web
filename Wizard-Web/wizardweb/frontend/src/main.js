import { createApp } from 'vue';
import App from './App.vue';

// Expose backend navigation (works when running against Play on localhost:9000)
window.INGAME_URL = window.INGAME_URL || '/ingame';
// Updated: go to the setup/menu first so player number and names are collected
window.start_game = window.start_game || function(){
    try { window.location.href = '/menu'; }
    catch(_) { try { window.location.assign('/menu'); } catch(__) {} }
};

createApp(App).mount('#app');