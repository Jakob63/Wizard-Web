// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// Seiten importieren
import MenuPage from '../components/MenuPage.vue';
import RulesPage from '../components/RulesPage.vue';
import TuiPage from '../components/TuiPage.vue';
import WizardScore from '../components/WizardScore.vue';

const routes = [
    {
        path: '/',
        redirect: '/menu', // Standardroute
    },
    {
        path: '/menu',
        name: 'Menu',
        component: MenuPage,
    },
    {
        path: '/rules',
        name: 'Rules',
        component: RulesPage,
    },
    {
        path: '/tui',
        name: 'Tui',
        component: TuiPage,
    },
    {
        path: '/score',
        name: 'Score',
        component: WizardScore,
    },
    {
        path: '/:pathMatch(.*)*', // Fallback für nicht definierte Routen
        redirect: '/menu',
    },
];

const router = createRouter({
    history: createWebHistory(), // HTML5 History Mode
    routes,
});

export default router;
