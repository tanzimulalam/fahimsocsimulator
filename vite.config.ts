import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || "";

  return {
    base: "/fahimsocsimulator/",
    plugins: [react()],
    server: {
      // Dev-only: browser calls same-origin /__openai/... ; Vite adds Authorization (avoids OpenAI CORS + keeps key off the client bundle when using OPENAI_API_KEY).
      proxy: {
        "/__openai": {
          target: "https://api.openai.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__openai/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (openaiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${openaiKey}`);
              }
            });
          },
        },
      },
    },
  };
});
