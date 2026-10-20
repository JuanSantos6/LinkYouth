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
 * Las pantallas de `(app)/` que exigen sesión, más el panel de empresa.
 * `/empleos` y `/eventos` ya no están: desde el 2026-09-26 se leen sin cuenta
 * (`EXPLORABLES` en `src/lib/navegacion.ts`).
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
 * La portada y las tres informativas están enlazadas desde la cabecera y el
 * pie, que aparecen en todas las pantallas: si el guard se las come, el sitio
 * le pide credenciales a alguien que solo quería leer qué es LinkYouth.
 */
const RUTAS_PUBLICAS = [
  "/",
  "/login",
  "/registro",
  "/empresas",
  "/como-funciona",
  "/legales",
  "/empleos",
  "/eventos",
  "/contacto",
];

test.describe("guard de rutas sin sesión", () => {
  /**
   * Verificado el 2026-09-12 desactivando a mano el `if (!user)` de
   * `src/middleware.ts`: solo `/eventos` y `/postulaciones` se ponen rojos.
   *
   * `/inicio` y `/perfil` no dependen solo del middleware: llaman a
   * `obtenerPerfilActual()`, que tiene su propio `redirect("/login")`. Son dos
   * barreras y no una, que es lo que se buscaba. (`/empleos` y `/eventos`
   * salieron de esta lista el 2026-09-26, cuando pasaron a leerse sin sesión.)
   *
   * La consecuencia práctica: `/postulaciones` es la única cubierta por una
   * sola capa. Si alguien toca el guard, ese test es el que avisa.
   */
  for (const ruta of RUTAS_PRIVADAS) {
    test(`${ruta} redirige a /login y recuerda a dónde iba`, async ({
      page,
    }) => {
      await page.goto(ruta);

      const url = new URL(page.url());
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.get("next")).toBe(ruta);
    });
  }

  test("/ muestra la portada y no el feed", async ({ page }) => {
    // Antes `/` redirigía a `/inicio` y el middleware cortaba en `/login`.
    // Desde que existe la portada, `/` es la puerta de entrada pública: tiene
    // que abrirse sin sesión, y no puede colarse el feed de nadie.
    await page.goto("/");

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /primer trabajo/i }),
    ).toBeVisible();
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

/**
 * Navegación sin sesión: que nadie quede encerrado entre `/login` y las
 * pantallas que piden cuenta.
 *
 * El caso que motivó estos tests: el logo del login llevaba a
 * `/como-funciona`, el de las pantallas públicas a `/inicio` —que rebotaba a
 * `/login`— y no había ningún camino de vuelta a la portada.
 */
test.describe("navegación pública", () => {
  test("el login tiene el logo y un enlace visible a la portada", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("link", { name: /volver a la página principal/i }),
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("link", { name: "LinkYouth", exact: true }),
    ).toHaveAttribute("href", "/");
  });

  for (const ruta of ["/como-funciona", "/empleos", "/eventos"]) {
    test(`el logo de ${ruta} lleva a la portada sin sesión`, async ({
      page,
    }) => {
      await page.goto(ruta);

      await page
        .getByRole("banner")
        .getByRole("link", { name: "LinkYouth" })
        .click();

      await expect(page).toHaveURL(/\/$/);
      await expect(
        page.getByRole("heading", { level: 1, name: /primer trabajo/i }),
      ).toBeVisible();
    });
  }

  test("el pie sin sesión no ofrece secciones de una cuenta", async ({
    page,
  }) => {
    await page.goto("/como-funciona");
    const pie = page.getByRole("contentinfo");

    await expect(
      pie.getByRole("link", { name: "Mis postulaciones" }),
    ).toHaveCount(0);
    await expect(
      pie.getByRole("link", { name: "LinkYouth" }).first(),
    ).toHaveAttribute("href", "/");
  });

  test("/empleos invita a crear cuenta y «Postularme» lleva al registro", async ({
    page,
  }) => {
    await page.goto("/empleos");

    await expect(
      page.getByText(/creá tu cuenta para ver cuánto coincidís/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Crear mi cuenta" }),
    ).toHaveAttribute("href", "/registro?next=%2Fempleos");
  });

  test("/login vuelve a una ruta interna y descarta una externa", async ({
    page,
  }) => {
    const campo = page.locator('input[type="hidden"][name="next"]');

    await page.goto("/login?next=/empleos");
    await expect(campo).toHaveValue("/empleos");

    for (const externa of [
      "https://ejemplo.com",
      "//ejemplo.com",
      "/\\ejemplo.com",
    ]) {
      await page.goto(`/login?next=${encodeURIComponent(externa)}`);
      await expect(campo).toHaveCount(0);
    }
  });
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
