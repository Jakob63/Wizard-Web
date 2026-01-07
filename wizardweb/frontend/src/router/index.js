import { createRouter, createWebHistory } from 'vue-router';
import MenuPage from '../components/MenuPage.vue';
import RulesPage from '../components/RulesPage.vue';
import TuiPage from '../components/TuiPage.vue';
import IngamePage from '../components/IngamePage.vue';
import OfflineGame from '../components/OfflineGame.vue';

const routes = [
    { path: '/', redirect: '/menu' },
    { path: '/menu', component: MenuPage },
    { path: '/rules', component: RulesPage },
    { path: '/tui', component: TuiPage },
    { path: '/ingame', component: IngamePage },
    { path: '/offline', component: OfflineGame }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
