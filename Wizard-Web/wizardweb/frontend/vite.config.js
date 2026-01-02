import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    return {
        plugins: [
            vue({
                template: {
                    compilerOptions: {
                        isCustomElement: (tag) => ['lite-youtube'].includes(tag)
                    }
                }
            }),
            isProd && VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,vue}'],
                    maximumFileSizeToCacheInBytes: 5600000,
                    navigateFallback: '/index.html'
                },
                includeAssets: ['W_icon.png', '512_W_icon.png'],
                manifest: {
                    name: 'Wizard PWA',
                    short_name: 'Wiz PWA',
                    description: 'Wizard PWA',
                    theme_color: '#4A4A4A',
                    background_color: '#ffffff',
                    display: 'standalone',
                    icons: [
                        { src: 'W_icon.png', sizes: '192x192', type: 'image/png' },
                        { src: '512_W_icon.png', sizes: '512x512', type: 'image/png' }
                    ]
                },
                devOptions: { enabled: false }
            })
        ].filter(Boolean),
        resolve: {
            alias: {
                '@playstyles': path.resolve(__dirname, '../app/assets/stylesheets')
            }
        },
        server: {
            fs: {
                allow: [
                    '.',
                    path.resolve(__dirname, '..'),
                    path.resolve(__dirname, '../app/assets/stylesheets')
                ]
            },
            proxy: {
                '/assets': { target: 'http://localhost:9000', changeOrigin: true },
                '/jsroutes': { target: 'http://localhost:9000', changeOrigin: true },
                '/javascriptRoutes': { target: 'http://localhost:9000', changeOrigin: true },
                '/api': { target: 'http://localhost:9000', changeOrigin: true },
                '/game/socket': { target: 'ws://localhost:9000', ws: true }
            }
        }
    };
});