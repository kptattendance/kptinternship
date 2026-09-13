import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    plugins: [react(), tailwindcss()],

    // HTTPS is required only for local development
    server: isDev
      ? {
          host: "local.kptplacements.org",
          port: 443,
          strictPort: true,
          https: {
            key: fs.readFileSync(
              "./local.kptplacements.org-key.pem"
            ),
            cert: fs.readFileSync(
              "./local.kptplacements.org.pem"
            ),
          },
        }
      : undefined,
  };
});