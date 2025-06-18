import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'PitaCSS',
      fileName: 'PitaCSS',
      formats: ['es'], // 明示的に指定
      assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'PitaCSS.css'
          }
          return assetInfo.name
        },
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue' // UMD用のグローバル変数名
        },
        assetFileNames: 'PitaCSS.[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  }
})
