import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  let outDir = "dist";
  if (mode === "azure") {
    outDir = "../backend/Orders.Api/wwwroot";
  }
  return {
    plugins: [react()],
    build: {
      outDir,
      emptyOutDir: true,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/setupTests.ts"],
    },
  };
});
