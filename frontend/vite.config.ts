import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
  };
});
