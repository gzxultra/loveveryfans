import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./client/src/__tests__/setup.ts"],
    include: ["client/src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,py}"],
    css: false,
    mockReset: true,
  },
});
