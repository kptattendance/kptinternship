import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    plugins: [react(), tailwindcss()],

    // Keep big libraries in their own files so browsers can cache them
    // between deployments, and pages download only what they need
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            clerk: ["@clerk/clerk-react"],
          },
        },
      },
    },

    // HTTPS is required only for local development
    server: isDev
      ? {
          host: "local.intern.kptmangaluru.in",
          port: 443,
          strictPort: true,
          https: {
            key: fs.readFileSync(
              "./local.intern.kptmangaluru.in-key.pem"
            ),
            cert: fs.readFileSync(
              "./local.intern.kptmangaluru.in.pem"
            ),
          },
        }
      : undefined,
  };
});