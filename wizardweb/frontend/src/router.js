import { createRouter, createWebHashHistory } from 'vue-router';

import IndexPage from './components/IndexPage.vue';
import HomePage from './components/HomePage.vue';
import MenuPage from './components/MenuPage.vue';
import RulesPage from './components/RulesPage.vue';
import IngamePage from './components/IngamePage.vue';
import LoadingPage from './components/LoadingPage.vue';
import EndscreenPage from './components/EndscreenPage.vue';

const routes = [
    { path: '/', component: IndexPage },
    { path: '/home', component: HomePage },
    { path: '/menu', component: MenuPage },
    { path: '/rules', component: RulesPage },
    { path: '/loading', component: LoadingPage },
    { path: '/ingame', component: IngamePage },
    { path: '/play/:name', component: IngamePage, props: true },
    { path: '/endscreen', component: EndscreenPage }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
