import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL;

  return {
    plugins: [react()],
    base: mode === "development" ? "/" : "/static/",
    server: {
      proxy: apiBaseUrl
        ? {
            "/api.v1.KatariveService": {
              target: apiBaseUrl,
              changeOrigin: true,
            },
            "/file": {
              target: apiBaseUrl,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
