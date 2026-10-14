import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { readFileSync as rf, writeFileSync as wf, existsSync as ex } from "node:fs";

function stampServiceWorker() {
  const id = Date.now().toString(36);
  return {
    name: "stamp-sw",
    apply: "build" as const,
    closeBundle() {
      const f = fileURLToPath(new URL("./dist/sw.js", import.meta.url));
      if (ex(f)) wf(f, rf(f, "utf8").replace("__BUILD__", id));
    },
  };
}
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// A static single-page build. The relative base lets the same dist/ run from
// https://<user>.github.io/Gravity-Lab/ or any other folder or host.
export default defineConfig({
  base: "./",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 8080 },
  preview: { port: 8081 },
  plugins: [tailwindcss(), react(), stampServiceWorker()],
});
