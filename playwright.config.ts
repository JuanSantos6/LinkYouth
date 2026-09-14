import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de extremo a extremo.
 *
 * `webServer` levanta y baja `npm run dev` solo, así que la suite no depende de
 * que alguien se acuerde de arrancar el servidor. En local reutiliza el que ya
 * esté corriendo; en CI siempre levanta uno propio, para no heredar el estado
 * de otra corrida.
 *
 * Un solo navegador a propósito: lo que se prueba acá es el middleware y las
 * cabeceras, que no dependen del motor de render. Cuando haya tests de
 * interfaz, ahí sí conviene sumar Firefox y WebKit.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
