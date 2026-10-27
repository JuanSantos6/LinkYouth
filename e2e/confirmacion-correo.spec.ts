import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * RF1.1 y RF1.3 — Después de confirmar el correo se puede entrar.
 *
 * El flujo que rompió el 2026-10-27: registro → enlace del correo → inicio de
 * sesión con el correo → cierre → inicio con el nombre de usuario. El correo
 * no se manda: `generateLink` crea la cuenta sin confirmar con la misma
 * `user_metadata` que deja el registro y devuelve el token del enlace, que es
 * lo que el correo lleva a `/auth/callback`.
 *
 * Las empresas no tienen nombre de usuario (RF1.3.1 es del joven): su segundo
 * inicio de sesión es con el correo otra vez.
 *
 * Con `E2E_URL_PUBLICA` corre a través del WAF (ver `playwright.config.ts`).
 * Crea dos cuentas descartables y las borra al terminar.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-Confirmacion-2026!";
const ids: string[] = [];

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});

async function registrarSinConfirmar(
  email: string,
  datos: Record<string, unknown>,
) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: PASSWORD,
    options: { data: datos },
  });
  if (error || !data.user) throw error ?? new Error("sin usuario");
  ids.push(data.user.id);
  return { id: data.user.id, token: data.properties.hashed_token };
}

async function iniciarSesion(page: Page, identificador: string) {
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(identificador);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

async function cerrarSesion(page: Page) {
  // El menú es un componente de cliente: un clic antes de la hidratación no
  // lo abre.
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Menú de tu cuenta" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
}

test("joven: confirma el correo, entra con el correo y después con el nombre de usuario", async ({
  page,
}) => {
  const email = `e2e-confirma-joven-${sufijo}@linkyouth.invalid`;
  const usuario = `e2e_confirma_${sufijo}`;
  const { id, token } = await registrarSinConfirmar(email, {
    nombre: "Camila",
    apellido: "Prueba",
    fecha_nacimiento: "2003-04-12",
    pais: "Uruguay",
    nombre_usuario: usuario,
    tags: [],
  });

  await page.goto(`/auth/callback?token_hash=${token}&type=signup`);
  await expect(page).toHaveURL(/\/login\?correo=confirmado/);

  // El alta se completa al confirmar, sin esperar al primer inicio de sesión.
  const { data: perfil } = await admin
    .from("perfiles")
    .select("nombre_usuario")
    .eq("id", id)
    .maybeSingle();
  expect(perfil?.nombre_usuario).toBe(usuario);

  await iniciarSesion(page, email);
  await expect(page).toHaveURL(/\/inicio/);
  await cerrarSesion(page);

  await iniciarSesion(page, usuario);
  await expect(page).toHaveURL(/\/inicio/);
});

test("empresa: confirma el correo y entra con el correo, dos veces", async ({
  page,
}) => {
  const email = `e2e-confirma-empresa-${sufijo}@linkyouth.invalid`;
  const { id, token } = await registrarSinConfirmar(email, {
    razon_social: `Confirmada E2E ${sufijo}`,
    rut: "",
    rubro: "Tecnología",
    descripcion: "Cuenta creada por la suite e2e. Se borra al terminar.",
    logo_url: "",
  });

  await page.goto(`/auth/callback?token_hash=${token}&type=signup`);
  await expect(page).toHaveURL(/\/login\?correo=confirmado/);

  const { data: empresa } = await admin
    .from("empresas")
    .select("razon_social")
    .eq("id", id)
    .maybeSingle();
  expect(empresa?.razon_social).toBe(`Confirmada E2E ${sufijo}`);

  await iniciarSesion(page, email);
  await expect(page).toHaveURL(/\/empresa/);
  await cerrarSesion(page);

  await iniciarSesion(page, email);
  await expect(page).toHaveURL(/\/empresa/);
});

test("un enlace usado o vencido lo dice en lenguaje claro", async ({
  page,
}) => {
  await page.goto("/auth/callback?token_hash=no-existe&type=signup");
  await expect(page).toHaveURL(/\/login\?correo=vencido/);
  await expect(
    page.getByRole("status").or(page.getByRole("alert")),
  ).toContainText(/enlace|vencid/i);
});
