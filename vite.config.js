import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    // Test du paiement Maketou en local : Maketou refuse localhost comme adresse de retour
    allowedHosts: ['localtest.me', '.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.trycloudflare.com'],
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/*.docx',
        '**/*.doc',
        '**/*.xlsx',
        '**/COMMENT INT SAAS/**',
        '**/izisaas mobile money skills/**',
        '**/*.log'
      ],
    },
  },
});
