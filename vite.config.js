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
        target: "http://localhost:4014",
        changeOrigin: true,
      },
      "/api/movies": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
      "/api/user": {
        target: "http://localhost:5001",
        changeOrigin: true,
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
