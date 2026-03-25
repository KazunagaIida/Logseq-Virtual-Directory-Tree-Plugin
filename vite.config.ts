import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: 'index.html',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    passWithNoTests: true,
  },
});
