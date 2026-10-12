import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, isPreview }) => ({
  server: { port: 8080 },
  preview: { port: 8081 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // Server-rendered build for Vercel (.vercel/output).
    ...(command === "build" || isPreview ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
}));
