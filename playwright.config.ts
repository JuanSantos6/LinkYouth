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
/**
 * Puerto 3100 y no 3000: en el servidor, el 3000 es producción (PM2). Una
 * suite que escribe en la base no puede apuntar ahí por accidente.
 */
const PUERTO = process.env.E2E_PUERTO ?? "3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `npm run dev -- -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
