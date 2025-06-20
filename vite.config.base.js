import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/base-index.css'),
      output: {
        assetFileNames: 'PitaCSS.base.css',
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
  }
})
