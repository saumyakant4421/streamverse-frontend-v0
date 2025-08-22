import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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
      "/api/franchises": {
        target: "https://backend-franchiseservice-v0.onrender.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/franchises/, '/api/franchises'),
      },
      "/api/movies": {
        target: "https://streamverse-movie-service.onrender.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/movies/, '/api/movies'),
      },
      "/api/user": {
        target: "https://backend-userservice-v0.onrender.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/user/, '/api/users'),
      },
      "/api/additional": {
        target: "https://backend-additionalservice-v0.onrender.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/additional/, '/api/additional'),
      },
      "/api/tools/watchparty": {
        target: "http://localhost:4004",
        changeOrigin: true,
      },
      "/api/tools/marathon": {
        target: "http://localhost:4004",
        changeOrigin: true,
      },
      "/api/recommendations": {
        target: "http://localhost:4002",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
  define: {
    // Define environment variables for production
    'process.env.VITE_MOVIE_API_URL': JSON.stringify(process.env.VITE_MOVIE_API_URL),
    'process.env.VITE_USER_API_URL': JSON.stringify(process.env.VITE_USER_API_URL),
    'process.env.VITE_WATCHPARTY_API_URL': JSON.stringify(process.env.VITE_WATCHPARTY_API_URL),
    'process.env.VITE_RECOMMENDATION_API_URL': JSON.stringify(process.env.VITE_RECOMMENDATION_API_URL),
    'process.env.VITE_MARATHON_API_URL': JSON.stringify(process.env.VITE_MARATHON_API_URL),
    'process.env.VITE_FRANCHISE_API_URL': JSON.stringify(process.env.VITE_FRANCHISE_API_URL),
  },
});
