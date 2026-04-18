import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss(), tanstackRouter()],
    resolve: {
      alias: {
        "@": "/src",
        "@assets": "/src/assets",
      },
    },
    server: {
      port: Number(env.VITE_APP_PORT) || 5173,
      proxy: {
        "/api": {
          target: `http://localhost:${env.VITE_SERVER_PORT || 3000}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      allowedHosts: true,
    },
  };
});
