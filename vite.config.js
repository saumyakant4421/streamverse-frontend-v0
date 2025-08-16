import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: [/\.jsx$/, /\.js$/],
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});