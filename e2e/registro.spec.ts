import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/**
 * RF1.1 y RF1.2 — Un error del registro no borra lo que se escribió.
 *
 * El error se provoca con un dato repetido (razón social o nombre de usuario
 * que ya existen): la acción lo detecta antes del `signUp`, así que no se crea
 * ninguna cuenta y la suite no deja nada en la base. Solo lee, con la clave
 * de servicio, un nombre que ya esté tomado.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const PASSWORD = "Prueba-Registro-2026!";

test("registro de empresa: el error queda junto al campo y no se pierde nada", async ({
  page,
}) => {
  const { data } = await admin
    .from("empresas")
    .select("razon_social")
    .limit(1)
    .single();
  test.skip(!data, "Hace falta al menos una empresa en la base.");
  const repetida = data!.razon_social;

  await page.goto("/registro?tipo=empresa");
  await page.getByLabel("Razón social").fill(repetida);
  await page.getByLabel("RUT").fill(`2199${String(Date.now()).slice(-8)}`);
  await page.getByLabel("Rubro").fill("Tecnología");
  await page
    .getByLabel("Descripción")
    .fill("Hacemos software a medida para pymes uruguayas.");
  await page
    .getByLabel("Correo electrónico")
    .fill("e2e-registro@linkyouth.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repetir la contraseña").fill(PASSWORD);
  await page.locator('input[name="privacidad"]').check();
  await page.getByRole("button", { name: "Crear cuenta de empresa" }).click();

  const campo = page.getByLabel("Razón social");
  await expect(page.locator("#error-razon_social")).toContainText(
    "razón social",
  );
  await expect(campo).toHaveAttribute("aria-invalid", "true");
  await expect(campo).toBeFocused();

  await expect(campo).toHaveValue(repetida);
  await expect(page.getByLabel("Rubro")).toHaveValue("Tecnología");
  await expect(page.getByLabel("Descripción")).toHaveValue(
    "Hacemos software a medida para pymes uruguayas.",
  );
  await expect(page.getByLabel("Correo electrónico")).toHaveValue(
    "e2e-registro@linkyouth.invalid",
  );
  await expect(page.locator('input[name="privacidad"]')).toBeChecked();
  // Las contraseñas no vuelven nunca del servidor.
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("");
});

test("registro de joven: el error queda junto al campo y no se pierde nada", async ({
  page,
}) => {
  const { data } = await admin
    .from("perfiles")
    .select("nombre_usuario")
    .limit(1)
    .single();
  test.skip(!data, "Hace falta al menos un perfil en la base.");
  const repetido = data!.nombre_usuario;

  await page.goto("/registro");
  await page.getByLabel("Nombre", { exact: true }).fill("Lucía");
  await page.getByLabel("Apellido").fill("Fernández");
  await page.getByLabel("Nombre de usuario").fill(repetido);
  await page.getByLabel("Fecha de nacimiento").fill("2003-04-12");
  await page
    .getByLabel("Correo electrónico")
    .fill("e2e-registro-joven@linkyouth.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repetir la contraseña").fill(PASSWORD);
  const intereses = page
    .getByRole("group", { name: /Áreas de interés/ })
    .getByRole("button");
  for (let i = 0; i < 5; i++) await intereses.nth(i).click();
  await page.locator('input[name="privacidad"]').check();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();

  const campo = page.getByLabel("Nombre de usuario");
  await expect(page.locator("#error-nombre_usuario")).toContainText(
    "nombre de usuario",
  );
  await expect(campo).toBeFocused();
  await expect(campo).toHaveValue(repetido);
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Lucía");
  await expect(page.getByLabel("Apellido")).toHaveValue("Fernández");
  await expect(page.getByLabel("Fecha de nacimiento")).toHaveValue(
    "2003-04-12",
  );
  await expect(
    intereses.and(page.locator('[aria-pressed="true"]')),
  ).toHaveCount(5);
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("");
});
