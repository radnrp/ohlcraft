import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    coverage: { reporter: ["text", "html"] },
  },
});
