import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/**
 * RF1.3.1 — Se entra con el nombre de usuario o con el correo, también a
 * través de la dirección pública (Tailscale Funnel + WAF).
 *
 * Solo corre con `E2E_URL_PUBLICA`: en local no hay WAF y no probaría nada
 * nuevo. Existe por el 2026-10-27, cuando la regla 922130 de CRS devolvía 403
 * al POST de `/login` y nadie podía entrar con ninguno de los dos datos.
 */

process.loadEnvFile(".env.local");

test.skip(
  !process.env.E2E_URL_PUBLICA,
  "Hace falta E2E_URL_PUBLICA para probar a través del WAF.",
);

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-Publica-2026!";
const EMAIL = `e2e-publico-${sufijo}@linkyouth.invalid`;
const USUARIO = `e2e_publico_${sufijo}`;
let id = "";

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("sin usuario");
  id = data.user.id;
  await admin.from("cuentas").insert({ id, tipo: "individual" });
  await admin.from("perfiles").insert({
    id,
    nombre: "Pública",
    apellido: "Prueba",
    fecha_nacimiento: "2003-04-12",
    pais: "Uruguay",
    nombre_usuario: USUARIO,
  });
});

test.afterAll(async () => {
  if (id) await admin.auth.admin.deleteUser(id);
});

for (const [como, identificador] of [
  ["el nombre de usuario", USUARIO],
  ["el correo", EMAIL],
] as const) {
  test(`se entra con ${como} por la dirección pública`, async ({ page }) => {
    const respuestas: number[] = [];
    page.on("response", (r) => {
      if (r.request().method() === "POST") respuestas.push(r.status());
    });

    await page.goto("/login?correo=confirmado");
    await page.getByLabel("Correo o nombre de usuario").fill(identificador);
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page).toHaveURL(/\/inicio/);
    expect(respuestas).not.toContain(403);
  });
}
