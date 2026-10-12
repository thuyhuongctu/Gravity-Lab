import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// A static single-page build. The relative base lets the same dist/ run from
// https://<user>.github.io/Gravity-Lab/ or any other folder or host.
export default defineConfig({
  base: "./",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 8080 },
  preview: { port: 8081 },
  plugins: [tailwindcss(), react()],
});
