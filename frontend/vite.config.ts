import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // The Leads page's /ws/leads WebSocket goes through this same /api
        // proxy in local dev (see lib/api.ts's getLeadsSocketUrl) — without
        // this, Vite only proxies plain HTTP and the socket connection fails.
        ws: true,
      },
    },
    watch: {
      // New/renamed files in public/ (e.g. thumbnails) can briefly be locked
      // by Windows (antivirus/Explorer) while being written or renamed. That
      // raises an EBUSY error when chokidar tries to attach a native watch
      // handle, and on Windows that error isn't always swallowed — it
      // crashes the whole dev server process instead of just failing to
      // watch that one file. awaitWriteFinish narrows the race but doesn't
      // close it for renames, so public/ is excluded from the watcher
      // entirely instead: static assets there are still served correctly,
      // you just need a manual browser refresh after adding/renaming one.
      ignored: ['**/public/**'],
    },
  },
})
