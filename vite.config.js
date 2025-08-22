import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Toggle for using local or remote (Render) services, read from .env via loadEnv
  const useLocal = env.VITE_USE_LOCAL_API === 'true';

  // Define targets for each service
  const franchiseTarget = useLocal
    ? 'http://localhost:5003'
    : 'https://backend-franchiseservice-v0.onrender.com';
  const movieTarget = useLocal
    ? 'http://localhost:4001' // match backend/movie-service/.env PORT
    : 'https://streamverse-movie-service.onrender.com';
  const userTarget = useLocal
    ? 'http://localhost:5001'
    : 'https://backend-userservice-v0.onrender.com';
  const additionalTarget = useLocal
    ? 'http://localhost:5004'
    : 'https://backend-additionalservice-v0.onrender.com';

  // Recommend and social are always local (not deployed)
  const recommendTarget = 'http://localhost:4002';
  const watchPartyTarget = 'http://localhost:4004';
  const marathonTarget = 'http://localhost:4004';

  return {
    plugins: [
      react({
        include: "**/*.{js,jsx,ts,tsx}",
      })
    ],
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.[tj]sx?$/,
      exclude: [],
    },
    server: {
      port: 3000,
      proxy: {
        // Deployed or local franchise service
        "/api/franchises": {
          target: franchiseTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/franchises/, '/api/franchises'),
        },
        // Deployed or local movie service
        "/api/movies": {
          target: movieTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/movies/, '/api/movies'),
        },
        // Deployed or local user service
        "/api/user": {
          target: userTarget,
          changeOrigin: true,
          // keep path as-is for local dev; production baseURL handled in services.js
          rewrite: path => path.replace(/^\/api\/user/, '/api/user'),
        },
        // Deployed or local additional service
        "/api/additional": {
          target: additionalTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/additional/, '/api/additional'),
        },
        // Always local recommend and social
        "/api/recommendations": {
          target: recommendTarget,
          changeOrigin: true,
        },
        "/api/tools/watchparty": {
          target: watchPartyTarget,
          changeOrigin: true,
        },
        "/api/tools/marathon": {
          target: marathonTarget,
          changeOrigin: true,
        },
        // Add social-service proxy here if needed
        // "/api/social": {
        //   target: 'http://localhost:4005',
        //   changeOrigin: true,
        // },
      },
    },
    build: {
      outDir: "dist",
    },
    define: {
      // Define environment variables for production
      'process.env.VITE_MOVIE_API_URL': JSON.stringify(env.VITE_MOVIE_API_URL),
      'process.env.VITE_USER_API_URL': JSON.stringify(env.VITE_USER_API_URL),
      'process.env.VITE_WATCHPARTY_API_URL': JSON.stringify(env.VITE_WATCHPARTY_API_URL),
      'process.env.VITE_RECOMMENDATION_API_URL': JSON.stringify(env.VITE_RECOMMENDATION_API_URL),
      'process.env.VITE_MARATHON_API_URL': JSON.stringify(env.VITE_MARATHON_API_URL),
      'process.env.VITE_FRANCHISE_API_URL': JSON.stringify(env.VITE_FRANCHISE_API_URL),
    },
  };
});
