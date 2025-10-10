import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import eslint from 'vite-plugin-eslint'

export default defineConfig({
    plugins: [tailwindcss(), preact()],
    define: {
        __APP_VERSION__: JSON.stringify(process.env.VERSION || 'dev'),
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
})
