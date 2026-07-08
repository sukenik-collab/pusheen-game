import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080,
        watch: {
            // WSL: chokidar's native watcher doesn't see changes on /mnt/*
            // drives (9p mount), so hot-reload silently serves stale code.
            usePolling: true
        }
    }
});
