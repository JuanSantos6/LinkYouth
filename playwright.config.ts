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

/**
 * Con `E2E_URL_PUBLICA` (p. ej. `https://misvcl.tail3c384d.ts.net`) la suite
 * pega contra la dirección pública, o sea, a través de Tailscale Funnel y del
 * WAF, en vez de levantar `next dev`. Es lo único que atrapa un 403 del WAF
 * sobre un formulario que en local anda: el 2026-10-27 nadie podía iniciar
 * sesión y ningún test lo veía. Correr con `--workers=1`: el WAF limita los
 * POST de `/login` a 10 por minuto por IP.
 */
const PUBLICA = process.env.E2E_URL_PUBLICA;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: PUBLICA ?? `http://localhost:${PUERTO}`,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: PUBLICA
    ? undefined
    : {
        command: `npm run dev -- -p ${PUERTO}`,
        url: `http://localhost:${PUERTO}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
