import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        converter: resolve(import.meta.dirname, "toml-to-json/index.html"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["tests/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
  },
});
