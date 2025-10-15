import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Toggle for using local or remote (Render) services, read from .env via loadEnv
  const useLocal = env.VITE_USE_LOCAL_API === 'true';

  // Define targets for each service
  const franchiseTarget = useLocal
    ? 'http://localhost:5003'
    : 'https://franchise-service-285531167611.us-central1.run.app';
  const movieTarget = useLocal
    ? 'https://movie-service-285531167611.us-central1.run.app' // match backend/movie-service/.env PORT
    // : 'https://streamverse-movie-service.onrender.com';
    : 'https://movie-service-285531167611.us-central1.run.app';
  const userTarget = useLocal
    ? 'https://backend-userservice-v0.onrender.com'
    : 'https://backend-userservice-v0.onrender.com';
  // Use local additional service only when explicitly configured via VITE_USE_LOCAL_API
  let additionalTarget;
  if (useLocal && env.VITE_ADDITIONAL_API_URL) {
    try {
      // derive origin from the provided URL so proxy uses host:port
      additionalTarget = new URL(env.VITE_ADDITIONAL_API_URL).origin;
    } catch (err) {
      // if it's not a full URL, fallback to raw value or default
      additionalTarget = env.VITE_ADDITIONAL_API_URL.replace(/\/$/, '') || 'http://localhost:4004';
    }
  } else if (useLocal) {
    additionalTarget = 'http://localhost:4004';
  } else {
    additionalTarget = 'https://backend-additionalservice-v0.onrender.com';
  }

  // Recommend is local by design; other targets follow additionalTarget when relevant
  const recommendTarget = 'http://localhost:4002';
  const watchPartyTarget = additionalTarget;
  const marathonTarget = additionalTarget;

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
