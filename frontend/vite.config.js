import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: "local.kptplacements.org",
    port: 443,
    strictPort: true,

    https: {
      key: fs.readFileSync("./local.kptplacements.org-key.pem"),
      cert: fs.readFileSync("./local.kptplacements.org.pem"),
    },
  },
});