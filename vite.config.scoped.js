import { defineConfig } from 'vite'
import path from 'path'
import prefixer from 'postcss-prefix-selector'

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        prefixer({
          prefix: '.pita-css',
          exclude: [/:root/, /body/, /html/],
          transform(prefix, selector, prefixedSelector) {
            if (selector === 'body') {
              return prefix;
            } else {
              return prefixedSelector;
            }
          },
        }),
      ],
    },
  },
  build: {
    target: 'esnext', // 最新のブラウザ対応を明示する
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.css'),
      output: {
        assetFileNames: 'PitaCSS.scoped.css',
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
  }
})