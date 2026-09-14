import { expect, test } from "@playwright/test";

/**
 * Control de acceso y cabeceras de seguridad.
 *
 * Cubre los dos arreglos de la auditoría del 2026-09-12 que no tenían ninguna
 * red debajo: el guard de rutas del middleware (que hasta ese día no existía) y
 * las cabeceras de CN-002.
 *
 * Ninguno de estos tests escribe en la base. Es deliberado: el proyecto de
 * Supabase es el mismo que usa la aplicación, así que una suite que registre
 * usuarios dejaría cuentas huérfanas en cada corrida y se bloquearía sola
 * contra el límite de correos del plan gratuito. El flujo de registro y login
 * queda anotado en `docs/plan.md` hasta que exista un proyecto de test aparte.
 *
 * Supuesto del entorno: `.env.local` tiene credenciales de Supabase. Sin
 * ellas el middleware deja pasar todo por diseño (§2.3 de `arquitectura.md`) y
 * estos tests fallan — que es la respuesta correcta, porque significa que el
 * entorno no es el que se está probando.
 */

/**
 * Las siete pantallas de `(app)/` más el panel de empresa. Todas exigen sesión.
 *
 * Que una cuenta individual no pueda entrar a `/empresa` y viceversa (RF1.2) no
 * se prueba acá: hace falta una sesión de cada tipo, y eso significa escribir
 * en la base. Queda con el resto del flujo de registro, en `plan.md`.
 *
 * `/avisos` y `/ajustes` se suman con el rediseño. Como `/eventos` y
 * `/postulaciones`, dependen solo del middleware: no llaman a
 * `obtenerPerfilActual()`, que es la segunda barrera de las otras.
 */
const RUTAS_PRIVADAS = [
  "/inicio",
  "/empleos",
  "/eventos",
  "/postulaciones",
  "/perfil",
  "/avisos",
  "/ajustes",
  "/empresa",
];

/**
 * Lo que `ENTRADA` e `INFORMATIVAS` de `src/middleware.ts` dejan pasar sin
 * sesión.
 *
 * Las tres informativas están enlazadas desde la cabecera y el pie, que
 * aparecen en todas las pantallas: si el guard se las come, el sitio le pide
 * credenciales a alguien que solo quería leer qué es LinkYouth.
 */
const RUTAS_PUBLICAS = [
  "/login",
  "/registro",
  "/empresas",
  "/como-funciona",
  "/legales",
];

test.describe("guard de rutas sin sesión", () => {
  /**
   * Verificado el 2026-09-12 desactivando a mano el `if (!user)` de
   * `src/middleware.ts`: solo `/eventos` y `/postulaciones` se ponen rojos.
   *
   * Las otras tres no dependen solo del middleware — `/inicio`, `/empleos` y
   * `/perfil` llaman a `obtenerPerfilActual()`, que tiene su propio
   * `redirect("/login")` (`consultas.ts:206`), y `/` cae en `/inicio`. Son dos
   * barreras y no una, que es lo que se buscaba.
   *
   * La consecuencia práctica: `/eventos` y `/postulaciones` son las únicas
   * cubiertas por una sola capa. Si alguien toca `PUBLICAS` o el guard, esos
   * dos tests son los que avisan.
   */
  for (const ruta of RUTAS_PRIVADAS) {
    test(`${ruta} redirige a /login`, async ({ page }) => {
      await page.goto(ruta);

      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("/ redirige a /login y no al feed", async ({ page }) => {
    // `src/app/page.tsx` manda a /inicio; el middleware corta después.
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("rutas públicas", () => {
  for (const ruta of RUTAS_PUBLICAS) {
    test(`${ruta} se abre sin sesión`, async ({ page }) => {
      // Si el guard se pasa de rosca y también protege estas dos, se bloquea a
      // sí mismo: nadie puede llegar a iniciar sesión.
      await page.goto(ruta);

      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

test.describe("cabeceras de seguridad (CN-002)", () => {
  test("la respuesta trae las tres cabeceras", async ({ page }) => {
    const respuesta = await page.goto("/login");
    const cabeceras = respuesta!.headers();

    expect(cabeceras["x-frame-options"]).toBe("DENY");
    expect(cabeceras["x-content-type-options"]).toBe("nosniff");
    expect(cabeceras["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });
});
