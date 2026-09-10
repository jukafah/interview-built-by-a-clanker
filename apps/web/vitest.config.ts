import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/components/**/*.test.tsx"],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src/components/**/*.{ts,tsx}"],
      reportsDirectory: "./coverage/components",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportOnFailure: true,
    },
  },
});
