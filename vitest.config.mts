import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Tests unitarios de las reglas de negocio (src/lib/dominio). Los e2e van
// aparte, con Playwright, en e2e/.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
