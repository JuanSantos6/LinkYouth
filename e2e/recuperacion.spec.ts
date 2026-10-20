import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/**
 * RF1.3.1 (entrar con el nombre de usuario) y RF1.8 (recuperar la contraseña).
 *
 * A diferencia de `auth.spec.ts`, esta suite escribe en la base: crea una
 * cuenta descartable con la clave de servicio y la borra al terminar. Desde
 * que Supabase corre en el servidor no hay límite de correos que agotar, y el
 * enlace de recuperación se genera con la API de administración, sin mandar
 * ningún correo. La cuenta usa el dominio reservado `.invalid` y no tiene
 * postulaciones ni reseñas, así que borrarla no rompe la regla de no borrar
 * nunca esas filas.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const CUENTA = {
  email: `e2e-recuperacion-${sufijo}@linkyouth.invalid`,
  usuario: `e2e_rec_${sufijo}`,
  password: "Vieja-Clave-2026!",
  nueva: "Nueva-Clave-2026!",
};
let userId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: CUENTA.email,
    password: CUENTA.password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("sin usuario");
  userId = data.user.id;

  const cuenta = await admin
    .from("cuentas")
    .insert({ id: userId, tipo: "individual" });
  if (cuenta.error) throw cuenta.error;
  const perfil = await admin.from("perfiles").insert({
    id: userId,
    nombre_usuario: CUENTA.usuario,
    nombre: "Prueba",
    apellido: "Recuperación",
    fecha_nacimiento: "2000-01-01",
    pais: "Uruguay",
  });
  if (perfil.error) throw perfil.error;
});

test.afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

async function entrar(
  page: import("@playwright/test").Page,
  identificador: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(identificador);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("entra con el nombre de usuario (RF1.3.1)", async ({ page }) => {
  await entrar(page, CUENTA.usuario, CUENTA.password);
  await expect(page).toHaveURL(/\/inicio/);
});

test("un usuario inexistente recibe el mismo mensaje que una contraseña mala", async ({
  page,
}) => {
  await entrar(page, `no_existe_${sufijo}`, CUENTA.password);
  await expect(
    page.getByText("El usuario o la contraseña no son correctos."),
  ).toBeVisible();
});

test("pedir el enlace no dice si la cuenta existe (RF1.8.2)", async ({
  page,
}) => {
  await page.goto("/recuperar");
  await page
    .getByLabel("Correo electrónico")
    .fill(`no-existe-${sufijo}@linkyouth.invalid`);
  await page.getByRole("button", { name: "Mandame el enlace" }).click();
  await expect(
    page.getByText(/Si hay una cuenta con ese correo/),
  ).toBeVisible();
});

test("el enlace del correo lleva a elegir una contraseña nueva (RF1.8.4)", async ({
  page,
}) => {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: CUENTA.email,
  });
  if (error) throw error;

  await page.goto(
    `/auth/callback?token_hash=${data.properties.hashed_token}&type=recovery`,
  );
  await expect(page).toHaveURL(/\/recuperar\/nueva/);

  await page.getByLabel("Contraseña", { exact: true }).fill(CUENTA.nueva);
  await page.getByLabel(/Repet|Confirm/).fill(CUENTA.nueva);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL(/\/inicio/);

  await page.context().clearCookies();
  await entrar(page, CUENTA.email, CUENTA.nueva);
  await expect(page).toHaveURL(/\/inicio/);
});

test("un enlace vencido o usado vuelve a pedir uno nuevo", async ({ page }) => {
  await page.goto("/auth/callback?token_hash=usado&type=recovery");
  await expect(page).toHaveURL(/\/recuperar\?motivo=vencido/);
  await expect(page.getByRole("alert")).toContainText("ya no sirve");
});
