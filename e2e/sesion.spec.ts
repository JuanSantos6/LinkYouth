import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * Con sesión, la portada no se muestra y cada cuenta ve solo su menú.
 *
 * Antes `/` se renderizaba igual con sesión, y la cabecera de una empresa
 * ofrecía «Nosotros», «Cómo funciona», «Búsquedas», «Opiniones» y
 * «Preguntas»: el menú de la portada pública.
 *
 * Crea una empresa y un joven descartables (dominio `.invalid`) con la clave
 * de servicio y los borra al terminar.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-E2E-2026!";
const EMPRESA = `e2e-sesion-empresa-${sufijo}@linkyouth.invalid`;
const JOVEN = `e2e-sesion-joven-${sufijo}@linkyouth.invalid`;
const ids: string[] = [];

const MENU_DE_PORTADA = [
  "Nosotros",
  "Cómo funciona",
  "Búsquedas",
  "Opiniones",
  "Preguntas",
];

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

test.describe.configure({ mode: "serial", timeout: 60_000 });

test.beforeAll(async () => {
  const empresaId = await crearCuenta(EMPRESA);
  await exigir(
    admin.from("cuentas").insert({ id: empresaId, tipo: "empresa" }),
  );
  await exigir(
    admin.from("empresas").insert({
      id: empresaId,
      razon_social: `Empresa Sesión ${sufijo}`,
      rubro: "Tecnología",
      descripcion: "Empresa creada por la suite e2e. Se borra al terminar.",
    }),
  );

  const jovenId = await crearCuenta(JOVEN);
  await exigir(
    admin.from("cuentas").insert({ id: jovenId, tipo: "individual" }),
  );
  await exigir(
    admin.from("perfiles").insert({
      id: jovenId,
      nombre_usuario: `e2e_sesion_${sufijo}`,
      nombre: "Joven",
      apellido: "De Sesión",
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

const menu = (page: Page) =>
  page.getByRole("navigation", { name: "Secciones de LinkYouth" });

test("sin sesión, / muestra la portada con su menú", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  for (const seccion of MENU_DE_PORTADA) {
    await expect(menu(page).getByRole("link", { name: seccion })).toBeVisible();
  }
});

test("la empresa con sesión va de / a /empresa y ve solo su menú", async ({
  page,
}) => {
  await entrar(page, EMPRESA);
  await page.goto("/");
  await expect(page).toHaveURL(/\/empresa$/);

  for (const seccion of ["Panel", "Mis búsquedas", "Mis eventos"]) {
    await expect(menu(page).getByRole("link", { name: seccion })).toBeVisible();
  }
  for (const seccion of MENU_DE_PORTADA) {
    await expect(
      menu(page).getByRole("link", { name: seccion, exact: true }),
    ).toHaveCount(0);
  }

  // En las informativas la cabecera también es la de la empresa, y «Cómo
  // funciona» no aparece en ningún lado.
  await page.goto("/empresas");
  await expect(menu(page).getByRole("link", { name: "Panel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cómo funciona" })).toHaveCount(
    0,
  );
  await page.goto("/como-funciona");
  await expect(page).toHaveURL(/\/empresa$/);
});

test("el joven con sesión va de / a /inicio y ve solo su menú", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/");
  await expect(page).toHaveURL(/\/inicio$/);

  for (const seccion of ["Inicio", "Empleos", "Mis postulaciones"]) {
    await expect(menu(page).getByRole("link", { name: seccion })).toBeVisible();
  }
  for (const seccion of MENU_DE_PORTADA) {
    await expect(
      menu(page).getByRole("link", { name: seccion, exact: true }),
    ).toHaveCount(0);
  }
});

test("entrar con ?next=/ no vuelve a la portada", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/login?next=/");
  await page.getByLabel("Correo o nombre de usuario").fill(EMPRESA);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/empresa$/);
});
