import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
