import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      rollupTypes: true,       // すべてを1つの d.ts にバンドル
      insertTypesEntry: true,  // dist/index.d.ts を生成
      copyDtsFiles: false      // 個別 .d.ts を出力しない
    })
  ],
  build: {
    // 単一バンドル（JS を1ファイルに集約）
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PitaCSS',
      fileName: 'PitaCSS',
      formats: ['es'],
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
        globals: { vue: 'Vue' }, // UMD用のグローバル変数名
        assetFileNames: 'PitaCSS.[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  }
})
