import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // Static site: the page is prerendered to dist/client/index.html at build
      // time, so it can be served from any static host (Cloudflare Pages).
      prerender: { enabled: true, crawlLinks: true },
    }),
    viteReact(),
  ],
  // heic-to (libheif wasm) is a ~3 MB chunk, loaded only when a HEIC file is dropped.
  build: { chunkSizeWarningLimit: 3500 },
})
