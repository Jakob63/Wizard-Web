import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        vue({
            // Treat web components as custom elements so Vue doesn't try to resolve them
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => ['wizard-score', 'lite-youtube'].includes(tag)
                }
            }
        }), VitePWA({ // <--- 2. Add the PWA configuration
            registerType: 'autoUpdate', // Automatically update service worker
            injectRegister: 'auto',     // Automatically inject the registration code

            // 3. Define the Service Worker Generation Strategy
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,vue}'],
                maximumFileSizeToCacheInBytes: 5600000 // 5.6 MB
            },

            // 4. Define the Manifest (REQUIRED for installability)
            manifest: {
                name: 'Wizard PWA',
                short_name: 'Wiz PWA',
                description: 'Wizard PWA',
                theme_color: '#4A4A4A',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    // IMPORTANT: Replace these with your own branded icons
                    {
                        src: 'W_icon.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '512_W_icon.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    resolve: {
        alias: {
            '@playstyles': path.resolve(__dirname, '../app/assets/stylesheets')
        }
    },
    server: {
        fs: {
            // Optional: if you still import LESS relatively from ../app, keep these allow paths
            allow: [
                '.',
                path.resolve(__dirname, '..'),
                path.resolve(__dirname, '../app/assets/stylesheets')
            ]
        },
        proxy: {
            // Play backend (adjust target if backend runs elsewhere)
            '/assets': { target: 'http://localhost:9000', changeOrigin: true },
            '/jsroutes': { target: 'http://localhost:9000', changeOrigin: true },
            '/javascriptRoutes': { target: 'http://localhost:9000', changeOrigin: true },

            // API endpoints used by legacy scripts
            '/api': { target: 'http://localhost:9000', changeOrigin: true },
            // WebSocket used by the game
            '/game/socket': { target: 'ws://localhost:9000', ws: true }
        }
    }
});