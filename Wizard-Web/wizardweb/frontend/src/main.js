import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

window.INGAME_URL = window.INGAME_URL || '/ingame';
window.start_game = window.start_game || function(){
    try { window.location.href = '/menu'; }
    catch(_) { try { window.location.assign('/menu'); } catch(__) {} }
};

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: () => import('./components/IndexPage.vue') },
        { path: '/home', component: () => import('./components/HomePage.vue') },
        { path: '/login', component: () => import('./components/LoginPage.vue') },
        { path: '/register', component: () => import('./components/RegisterPage.vue') },
        { path: '/loading', component: () => import('./components/LoadingPage.vue') },
        { path: '/ingame', component: () => import('./components/IngamePage.vue') },
        { path: '/play/:id', component: () => import('./components/IngamePage.vue') },
        { path: '/endscreen', component: () => import('./components/EndscreenPage.vue') },
        { path: '/menu', component: () => import('./components/MenuPage.vue') },
        { path: '/rules', component: () => import('./components/RulesPage.vue') },
    ]
});

const app = createApp(App);
app.use(router);
app.mount('#app');