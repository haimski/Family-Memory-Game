import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Loaded with no prefix filter so the plain (non-VITE_) API_URL is
  // readable here, in vite.config.js's Node context. Client code can't see
  // unprefixed vars - it uses import.meta.env.VITE_API_URL instead (see api.js).
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.API_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
