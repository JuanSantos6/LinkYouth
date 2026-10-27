import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

import { png } from "./ayudas/png";

/**
 * RF1.1.9 y RF1.2 — La imagen que se elige al registrarse no se pierde.
 *
 * Con la confirmación de correo obligatoria no hay sesión al registrarse, y la
 * subida a `avatars` (RLS por `auth.uid()`) fallaba: la foto o el logo se
 * descartaban sin avisar. Ahora la acción de registro la deja en el bucket
 * privado `pendientes` y el alta la mueve al confirmar (`imagenPendiente.ts`).
 *
 * El registro es por la interfaz, de verdad; el enlace del correo no se lee: se
 * pide con `generateLink`. Las direcciones son `.invalid`, así que GoTrue no
 * entrega nada. Crea tres cuentas descartables y las borra, con sus archivos.
 * Con `E2E_URL_PUBLICA` corre a través del WAF.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-Registro-Imagen-2026!";
const emails: string[] = [];

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  const { data } = await admin.auth.admin.listUsers({ perPage: 500 });
  for (const u of data.users.filter((x) => emails.includes(x.email ?? ""))) {
    for (const bucket of ["avatars", "pendientes"]) {
      const { data: archivos } = await admin.storage.from(bucket).list(u.id);
      if (archivos?.length) {
        await admin.storage
          .from(bucket)
          .remove(archivos.map((a) => `${u.id}/${a.name}`));
      }
    }
    await admin.auth.admin.deleteUser(u.id);
  }
});

async function usuarioDe(email: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 500 });
  const u = data.users.find((x) => x.email === email);
  if (!u) throw new Error(`no se creó ${email}`);
  return u;
}

async function archivosEn(bucket: string, id: string) {
  const { data } = await admin.storage.from(bucket).list(id);
  return (data ?? []).map((a) => a.name);
}

async function confirmar(page: Page, email: string) {
  const { data } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  await page.goto(
    `/auth/callback?token_hash=${data.properties?.hashed_token}&type=email`,
  );
  await expect(page).toHaveURL(/\/login\?correo=confirmado/);
}

async function entrar(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

async function registrarJoven(
  page: Page,
  email: string,
  usuario: string,
  imagen: { name: string; mimeType: string; buffer: Buffer },
) {
  emails.push(email);
  await page.goto("/registro");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Nombre", { exact: true }).fill("Registro");
  await page.getByLabel("Apellido").fill("Imagen");
  await page.getByLabel("Nombre de usuario").fill(usuario);
  await page.getByLabel("Fecha de nacimiento").fill("2003-04-12");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repetir la contraseña").fill(PASSWORD);
  const intereses = page
    .getByRole("group", { name: /Áreas de interés/ })
    .getByRole("button");
  for (let i = 0; i < 5; i++) await intereses.nth(i).click();
  await page.locator('input[name="avatar"]').setInputFiles(imagen);
  await page.locator('input[name="privacidad"]').check();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByText("Revisá tu correo")).toBeVisible({
    timeout: 30_000,
  });
}

test("joven: la foto elegida en el registro aparece en el perfil y en el panel", async ({
  page,
}) => {
  const email = `e2e-reg-joven-${sufijo}@linkyouth.invalid`;
  const usuario = `e2e_reg_${sufijo}`;
  await registrarJoven(page, email, usuario, {
    name: "yo.png",
    mimeType: "image/png",
    buffer: png(3 * 1024 * 1024),
  });
  await expect(page.getByText("Tu foto se guarda al confirmar.")).toBeVisible();

  const { id } = await usuarioDe(email);
  expect(await archivosEn("pendientes", id)).toEqual(["imagen.png"]);
  expect(await archivosEn("avatars", id)).toEqual([]);

  await confirmar(page, email);

  // Se movió: ya no está pendiente y quedó asociada al perfil.
  expect(await archivosEn("pendientes", id)).toEqual([]);
  expect(await archivosEn("avatars", id)).toContain("perfil.png");
  const { data: perfil } = await admin
    .from("perfiles")
    .select("foto_url")
    .eq("id", id)
    .single();
  expect(perfil?.foto_url).toContain(`/avatars/${id}/perfil.png`);

  await entrar(page, email);
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByText(/No pudimos guardar tu imagen/)).toHaveCount(0);
  const ruta = new RegExp(
    `/storage/v1/object/public/avatars/${id}/perfil\\.png`,
  );
  await expect(
    page.getByRole("button", { name: "Menú de tu cuenta" }).getByRole("img"),
  ).toHaveAttribute("src", ruta);

  await page.goto("/perfil");
  const foto = page.getByRole("img", { name: "Registro Imagen" }).first();
  await expect(foto).toHaveAttribute("src", ruta);
  await expect
    .poll(() => foto.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);

  await page.goto(`/personas/${usuario}`);
  await expect(
    page.getByRole("img", { name: "Registro Imagen" }).first(),
  ).toHaveAttribute("src", ruta);
});

test("empresa: el logo elegido en el registro aparece en el panel y en el perfil público", async ({
  page,
}) => {
  const email = `e2e-reg-empresa-${sufijo}@linkyouth.invalid`;
  const razon = `Registro Logo ${sufijo}`;
  emails.push(email);
  await page.goto("/registro?tipo=empresa");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Razón social").fill(razon);
  await page.getByLabel("RUT").fill(`2198${String(Date.now()).slice(-8)}`);
  await page.getByLabel("Rubro").fill("Tecnología");
  await page
    .getByLabel("Descripción")
    .fill("Empresa creada por la suite e2e. Se borra al terminar.");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repetir la contraseña").fill(PASSWORD);
  await page.locator('input[name="logo"]').setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: png(3 * 1024 * 1024),
  });
  await page.locator('input[name="privacidad"]').check();
  await page.getByRole("button", { name: "Crear cuenta de empresa" }).click();
  await expect(page.getByText("El logo se guarda al confirmar.")).toBeVisible();

  const { id } = await usuarioDe(email);
  expect(await archivosEn("pendientes", id)).toEqual(["imagen.png"]);

  await confirmar(page, email);
  expect(await archivosEn("pendientes", id)).toEqual([]);

  await entrar(page, email);
  await expect(page).toHaveURL(/\/empresa/);
  await expect(page.getByText(/No pudimos guardar tu imagen/)).toHaveCount(0);
  const ruta = new RegExp(
    `/storage/v1/object/public/avatars/${id}/perfil\\.png`,
  );
  await expect(
    page.getByRole("button", { name: "Menú de tu cuenta" }).getByRole("img"),
  ).toHaveAttribute("src", ruta);

  await page.goto(`/organizaciones/${id}`);
  const logo = page.getByRole("img", { name: razon }).first();
  await expect(logo).toHaveAttribute("src", ruta);
  await expect
    .poll(() => logo.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
});

test("si la imagen no sirve, el registro se completa, el panel avisa y se sube desde el perfil", async ({
  page,
}) => {
  const email = `e2e-reg-falla-${sufijo}@linkyouth.invalid`;
  // Dice ser PNG pero es HTML: el servidor mira los bytes, no el tipo.
  await registrarJoven(page, email, `e2e_falla_${sufijo}`, {
    name: "falsa.png",
    mimeType: "image/png",
    buffer: Buffer.from("<html><script>alert(1)</script></html>"),
  });
  const { id } = await usuarioDe(email);
  expect(await archivosEn("pendientes", id)).toEqual([]);

  await confirmar(page, email);
  await entrar(page, email);
  await expect(page).toHaveURL(/\/inicio/);
  await expect(
    page.getByText(
      "No pudimos guardar tu imagen; podés subirla desde tu perfil.",
    ),
  ).toBeVisible();

  await page.getByRole("link", { name: "Ir a mi perfil" }).click();
  await expect(page).toHaveURL(/\/perfil/);
  await page.waitForLoadState("networkidle");
  await page.getByTestId("foto-de-perfil").setInputFiles({
    name: "bien.png",
    mimeType: "image/png",
    buffer: png(1024 * 1024),
  });
  await expect(page.getByText("Foto actualizada.")).toBeVisible();

  await page.goto("/inicio");
  await expect(page.getByText(/No pudimos guardar tu imagen/)).toHaveCount(0);
});
