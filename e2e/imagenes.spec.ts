import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

import { png } from "./ayudas/png";

/**
 * RF1.5.6 y RF7.1 — El joven sube su foto y la empresa su logo, y se ven en
 * el perfil y en el menú de la cuenta (que es donde la app muestra la
 * identidad de la sesión).
 *
 * Las imágenes son PNG válidos generados acá: una de 3 MB, para que la
 * prueba pase por encima del 1 MB que Next acepta por defecto en una acción
 * de servidor y del 2 MB que tenía el bucket antes de la migración 011.
 *
 * Crea un joven y una empresa descartables y los borra, con sus archivos de
 * Storage, al terminar. Con `E2E_URL_PUBLICA` corre a través del WAF.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-Imagenes-2026!";
const JOVEN = {
  email: `e2e-img-joven-${sufijo}@linkyouth.invalid`,
  nombre: "Imagen",
  apellido: "Joven",
};
const EMPRESA = {
  email: `e2e-img-empresa-${sufijo}@linkyouth.invalid`,
  razon: `Imágenes E2E ${sufijo}`,
};
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

async function entrar(page: Page, correo: string) {
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

/** La imagen se pidió, llegó y es una imagen: no basta con que haya `<img>`. */
async function seVeLaImagen(page: Page, nombre: string, ruta: string) {
  const imagen = page.getByRole("img", { name: nombre }).first();
  await expect(imagen).toHaveAttribute("src", new RegExp(ruta));
  await expect
    .poll(() => imagen.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const jovenId = await crearCuenta(JOVEN.email);
  await admin.from("cuentas").insert({ id: jovenId, tipo: "individual" });
  await admin.from("perfiles").insert({
    id: jovenId,
    nombre: JOVEN.nombre,
    apellido: JOVEN.apellido,
    fecha_nacimiento: "2003-04-12",
    pais: "Uruguay",
    nombre_usuario: `e2e_img_${sufijo}`,
  });

  const empresaId = await crearCuenta(EMPRESA.email);
  await admin.from("cuentas").insert({ id: empresaId, tipo: "empresa" });
  await admin.from("empresas").insert({
    id: empresaId,
    razon_social: EMPRESA.razon,
    rubro: "Tecnología",
    descripcion: "Empresa creada por la suite e2e. Se borra al terminar.",
  });
});

test.afterAll(async () => {
  for (const id of ids) {
    const { data } = await admin.storage.from("avatars").list(id);
    if (data?.length) {
      await admin.storage
        .from("avatars")
        .remove(data.map((a) => `${id}/${a.name}`));
    }
    await admin.auth.admin.deleteUser(id);
  }
});

test("el joven sube su foto (3 MB) y se ve en el perfil y en el menú", async ({
  page,
}) => {
  await entrar(page, JOVEN.email);
  await expect(page).toHaveURL(/\/inicio/);
  await page.goto("/perfil");
  // El componente es de cliente: sin hidratar, el cambio del input no se atiende.
  await page.waitForLoadState("networkidle");

  await page.getByTestId("foto-de-perfil").setInputFiles({
    name: "mi-foto.png",
    mimeType: "image/png",
    buffer: png(3 * 1024 * 1024),
  });
  await expect(page.getByText("Foto actualizada.")).toBeVisible();

  await page.reload();
  const ruta = `/storage/v1/object/public/avatars/${ids[0]}/perfil\\.png`;
  await seVeLaImagen(page, `${JOVEN.nombre} ${JOVEN.apellido}`, ruta);
  // Y en el menú de la cuenta, que es lo que ve todo el sitio.
  await expect(
    page.getByRole("button", { name: "Menú de tu cuenta" }).getByRole("img"),
  ).toHaveAttribute("src", new RegExp(ruta));
});

test("el joven recibe una frase clara si la imagen no sirve", async ({
  page,
}) => {
  await entrar(page, JOVEN.email);
  await expect(page).toHaveURL(/\/inicio/);
  await page.goto("/perfil");
  // El componente es de cliente: sin hidratar, el cambio del input no se atiende.
  await page.waitForLoadState("networkidle");

  await page.getByTestId("foto-de-perfil").setInputFiles({
    name: "no-es-imagen.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hola"),
  });
  await expect(page.getByText(/tiene que ser JPG, PNG o WebP/)).toBeVisible();

  await page.getByTestId("foto-de-perfil").setInputFiles({
    name: "enorme.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByText(/supera los 5 MB/)).toBeVisible();
});

test("la empresa sube su logo (3 MB) y se ve en el perfil y en el panel", async ({
  page,
}) => {
  await entrar(page, EMPRESA.email);
  await expect(page).toHaveURL(/\/empresa/);
  await page.goto("/empresa/perfil");

  // El RUT es obligatorio en el formulario: sin él el navegador no envía.
  await page
    .locator('input[name="rut"]')
    .fill(`2199${sufijo.padEnd(8, "0").replace(/\D/g, "7").slice(0, 8)}`);
  await page.locator('input[name="logo"]').setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: png(3 * 1024 * 1024),
  });
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByText("Perfil actualizado.")).toBeVisible();

  await page.reload();
  const ruta = `/storage/v1/object/public/avatars/${ids[1]}/perfil\\.png`;
  await seVeLaImagen(page, EMPRESA.razon, ruta);

  await page.goto("/empresa");
  await expect(
    page.getByRole("button", { name: "Menú de tu cuenta" }).getByRole("img"),
  ).toHaveAttribute("src", new RegExp(ruta));
});
