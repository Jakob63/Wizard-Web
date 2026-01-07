// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHashHistory } from 'vue-router';

// Komponenten importieren
import IndexPage from './components/IndexPage.vue';
import HomePage from './components/HomePage.vue';
import IngamePage from './components/IngamePage.vue';
import LoadingPage from './components/LoadingPage.vue';
import EndscreenPage from './components/EndscreenPage.vue';
import RulesPage from './components/RulesPage.vue';
import MenuPage from './components/MenuPage.vue';

// Routen definieren
const routes = [
    { path: '/', component: IndexPage },
    { path: '/home', component: HomePage },
    { path: '/ingame', component: IngamePage },
    { path: '/loading', component: LoadingPage },
    { path: '/endscreen', component: EndscreenPage },
    { path: '/rules', component: RulesPage },
    { path: '/menu', component: MenuPage }
];

// Router erstellen (Hash-basierter Verlauf)
const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// Globale Variablen wie vorher
window.INGAME_URL = window.INGAME_URL || '/ingame';
window.start_game = window.start_game || function(){
    try { window.location.href = '/menu'; }
    catch(_) { try { window.location.assign('/menu'); } catch(__) {} }
};

// Vue App erstellen und Router verwenden
createApp(App).use(router).mount('#app');
