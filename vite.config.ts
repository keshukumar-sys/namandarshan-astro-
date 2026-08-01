import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // ✅ IMPORTANT FOR VERCEL SPA

  server: {
    host: "::",
    port: 8080,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5001",
        changeOrigin: true,
        ws: true,
      },
      "/sitemap.xml": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/sitemap-": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
    allowedHosts: ["596e-223-223-151-239.ngrok-free.app"],
  },

  plugins: [react()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));