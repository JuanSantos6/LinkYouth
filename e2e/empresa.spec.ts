import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * El circuito de la empresa de punta a punta, con datos reales (Etapa 2):
 * ninguna pantalla con datos de ejemplo, publicar una búsqueda, que un joven
 * se postule, llevar la postulación por sus estados y crear y cancelar un
 * evento.
 *
 * Escribe en la base: crea una empresa y un joven descartables con la clave
 * de servicio y borra las dos cuentas al terminar. La postulación y el evento
 * se van con ellas por `on delete cascade`; son filas de estas cuentas de
 * prueba (dominio `.invalid`), no datos de nadie.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-E2E-2026!";
const EMPRESA = {
  email: `e2e-empresa-${sufijo}@linkyouth.invalid`,
  razon: `Empresa E2E ${sufijo}`,
};
const JOVEN = {
  email: `e2e-joven-${sufijo}@linkyouth.invalid`,
  usuario: `e2e_joven_${sufijo}`,
};
const TITULO = `Analista de pruebas ${sufijo}`;
const EVENTO = `Charla de prueba ${sufijo}`;
const ids: string[] = [];

async function crearCuenta(email: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("sin usuario");
  ids.push(data.user.id);
  return data.user.id;
}

async function exigir(promesa: PromiseLike<{ error: unknown }>) {
  const { error } = await promesa;
  if (error) throw error;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const empresaId = await crearCuenta(EMPRESA.email);
  await exigir(
    admin.from("cuentas").insert({ id: empresaId, tipo: "empresa" }),
  );
  await exigir(
    admin.from("empresas").insert({
      id: empresaId,
      razon_social: EMPRESA.razon,
      rubro: "Tecnología",
      descripcion: "Empresa creada por la suite e2e. Se borra al terminar.",
    }),
  );

  const jovenId = await crearCuenta(JOVEN.email);
  await exigir(
    admin.from("cuentas").insert({ id: jovenId, tipo: "individual" }),
  );
  await exigir(
    admin.from("perfiles").insert({
      id: jovenId,
      nombre_usuario: JOVEN.usuario,
      nombre: "Joven",
      apellido: "De Prueba",
      fecha_nacimiento: "2002-05-10",
      pais: "Uruguay",
    }),
  );
});

test.afterAll(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});

async function entrar(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(empresa|inicio)/);
}

const PANTALLAS_DE_EMPRESA = [
  "/empresa",
  "/empresa/busquedas",
  "/empresa/busquedas/nueva",
  "/empresa/candidatos",
  "/empresa/eventos",
  "/empresa/eventos/nuevo",
  "/empresa/perfil",
  "/empresa/resenias",
];

test("ninguna pantalla de empresa muestra datos de ejemplo", async ({
  page,
}) => {
  // Recorre todas las pantallas de empresa: en desarrollo cada una compila
  // la primera vez, y con la suite en paralelo 30 s no alcanzan.
  test.setTimeout(60_000);
  const errores: string[] = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await entrar(page, EMPRESA.email);
  for (const ruta of PANTALLAS_DE_EMPRESA) {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status(), ruta).toBe(200);
    await expect(page.getByText("Contenido de demostración"), ruta).toHaveCount(
      0,
    );
  }
  expect(errores).toEqual([]);
});

test("la empresa publica una búsqueda (RF3.1)", async ({ page }) => {
  await entrar(page, EMPRESA.email);
  await page.goto("/empresa/busquedas/nueva");

  await page.getByLabel("Título").fill(TITULO);
  await page.getByLabel("Modalidad").selectOption("remota");
  await page
    .getByLabel("Descripción")
    .fill(
      "Buscamos a alguien con ganas de aprender a probar software, con o sin experiencia previa.",
    );
  await page
    .getByRole("group", { name: "Habilidades que pedís" })
    .getByRole("button")
    .first()
    .click();
  await page.getByRole("button", { name: "Publicar búsqueda" }).click();

  await page.waitForURL(/\/empresa\/busquedas\/[0-9a-f-]{36}(\?|$)/);
  await expect(page.getByRole("heading", { name: TITULO })).toBeVisible();
});

test("el joven se postula y la empresa lo lleva por los estados (RF3.6, RF3.4.3, RF6.2)", async ({
  page,
}) => {
  // Cuatro inicios de sesión y cinco cambios de estado: con la suite entera
  // en paralelo, 30 s no alcanzan.
  test.setTimeout(60_000);
  const { data: vacante } = await admin
    .from("vacantes")
    .select("id")
    .eq("titulo", TITULO)
    .single();
  expect(vacante).not.toBeNull();

  await entrar(page, JOVEN.email);
  await page.goto(`/empleos/${vacante!.id}`);
  await page.getByRole("button", { name: "Postularme" }).first().click();
  await expect(page.getByText("Ya te postulaste").first()).toBeVisible();

  await entrar(page, EMPRESA.email);
  await page.goto(`/empresa/busquedas/${vacante!.id}`);
  await page
    .getByRole("link", { name: /Joven De Prueba|e2e_joven/ })
    .first()
    .click();
  await page.waitForURL(/\/postulantes\//);

  const boton = (nombre: string) =>
    page.getByRole("button", { name: nombre, exact: true });
  await boton("Pasar a revisión").click();
  await expect(boton("Citar a entrevista")).toBeVisible();
  await boton("Citar a entrevista").click();
  // Hay que esperar el estado nuevo: «Seleccionar» ya está en la pantalla
  // anterior y desaparece cuando se refresca.
  await expect(page.getByText("Está en «Entrevista»")).toBeVisible();
  await boton("Seleccionar").click();
  await boton("Sí, seleccionar").click();
  await expect(page.getByText("Seleccionada").first()).toBeVisible();

  // El joven ve el aviso del cambio de estado (RF6.2).
  await entrar(page, JOVEN.email);
  await page.goto("/avisos");
  await expect(page.getByText(TITULO).first()).toBeVisible();
});

test("la empresa crea y cancela un evento (RF4.1, RF4.3)", async ({ page }) => {
  await entrar(page, EMPRESA.email);
  await page.goto("/empresa/eventos/nuevo");

  const manana = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const valor = `${manana.toISOString().slice(0, 10)}T18:30`;
  await page.getByLabel("Título").fill(EVENTO);
  await page
    .locator("textarea[name=descripcion]")
    .fill(
      "Una charla corta para contar cómo trabajamos y qué buscamos en quienes empiezan.",
    );
  await page.getByLabel("Día y hora").fill(valor);
  await page.getByRole("button", { name: "Crear evento" }).click();

  await page.waitForURL(/\/empresa\/eventos\/[0-9a-f-]{36}(\?|$)/);
  await expect(page.getByRole("heading", { name: EVENTO })).toBeVisible();

  await page.getByRole("button", { name: "Cancelar evento" }).click();
  await page.getByRole("button", { name: "Sí, cancelarlo" }).click();
  await expect(page.getByText(/cancelad/i).first()).toBeVisible();
});
