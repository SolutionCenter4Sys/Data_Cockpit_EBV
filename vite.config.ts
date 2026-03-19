import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': resolve(__dirname, 'src/domain'),
      '@data': resolve(__dirname, 'src/data'),
      '@app': resolve(__dirname, 'src/app'),
      '@presentation': resolve(__dirname, 'src/presentation'),
    },
  },
  server: {
    port: 8000,
    open: true,
  },
});
