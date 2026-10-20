import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * Avisos de los dos lados (RF6.1, RF6.2, RF6.3, migración 007).
 *
 * La empresa recibe un aviso cuando alguien se postula a su búsqueda y cuando
 * alguien se inscribe a su evento; el joven, cuando lo seleccionan o lo
 * descartan, con palabras y un enlace que lleva a esa postulación. La
 * campana de los dos muestra cuántos hay sin leer. Los avisos importantes
 * encolan un correo, y el despacho cierra los que van a dominios de prueba
 * sin mandarlos.
 *
 * Escribe en la base: crea una empresa y dos jóvenes descartables
 * (`.invalid`) y los borra al terminar, con todo lo suyo en cascada.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-Avisos-2026!";
const EMPRESA = {
  email: `e2e-av-empresa-${sufijo}@linkyouth.invalid`,
  razon: `Empresa Avisos ${sufijo}`,
};
const ELEGIDA = { email: `e2e-av-a-${sufijo}@linkyouth.invalid`, nombre: "Ana" };
const OTRO = { email: `e2e-av-b-${sufijo}@linkyouth.invalid`, nombre: "Beto" };
const BUSQUEDA = `Búsqueda Avisos ${sufijo}`;
const EVENTO = `Evento Avisos ${sufijo}`;

const ids: string[] = [];
let empresaId = "";
let elegidaId = "";
let otroId = "";
let vacanteId = "";
let eventoId = "";

async function exigir<R extends { data: unknown; error: unknown }>(
  promesa: PromiseLike<R>,
): Promise<NonNullable<R["data"]>> {
  const { data, error } = await promesa;
  if (error) throw error;
  return data as NonNullable<R["data"]>;
}

async function crearCuenta(email: string) {
  const { user } = await exigir(
    admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    }),
  );
  ids.push(user!.id);
  return user!.id;
}

async function crearJoven(email: string, nombre: string) {
  const id = await crearCuenta(email);
  await exigir(admin.from("cuentas").insert({ id, tipo: "individual" }));
  await exigir(
    admin.from("perfiles").insert({
      id,
      nombre_usuario: `e2e_av_${nombre.toLowerCase()}_${sufijo}`,
      nombre,
      apellido: "Avisos",
      fecha_nacimiento: "2002-03-01",
      pais: "Uruguay",
    }),
  );
  return id;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  empresaId = await crearCuenta(EMPRESA.email);
  await exigir(
    admin.from("cuentas").insert({ id: empresaId, tipo: "empresa" }),
  );
  await exigir(
    admin.from("empresas").insert({
      id: empresaId,
      razon_social: EMPRESA.razon,
      rubro: "Pruebas",
    }),
  );
  ({ id: vacanteId } = await exigir(
    admin
      .from("vacantes")
      .insert({
        empresa_id: empresaId,
        titulo: BUSQUEDA,
        descripcion: "Búsqueda de la suite de avisos.",
        tipo: "empleo",
        posiciones: 2,
        modalidad: "remota",
      })
      .select("id")
      .single(),
  ));
  ({ id: eventoId } = await exigir(
    admin
      .from("eventos")
      .insert({
        empresa_id: empresaId,
        titulo: EVENTO,
        descripcion: "Evento de la suite de avisos.",
        fecha_hora: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      })
      .select("id")
      .single(),
  ));
  elegidaId = await crearJoven(ELEGIDA.email, ELEGIDA.nombre);
  otroId = await crearJoven(OTRO.email, OTRO.nombre);
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
  await page.waitForURL(/\/(inicio|empresa)/, { timeout: 20_000 });
}

/** La campana de la cabecera, por su nombre accesible. */
const campana = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: /^Avisos/ });

test("la empresa recibe un aviso al recibir una postulación y una inscripción", async ({
  page,
}) => {
  await entrar(page, ELEGIDA.email);
  await page.goto(`/empleos/${vacanteId}`);
  await page.getByRole("button", { name: "Postularme" }).first().click();
  await expect(page.getByText("Ya te postulaste").first()).toBeVisible();

  await page.goto(`/eventos/${eventoId}`);
  await page.getByRole("button", { name: /Inscribirme/ }).first().click();
  await expect(page.getByText(/inscripto|inscripta/i).first()).toBeVisible();

  await entrar(page, EMPRESA.email);
  await expect(campana(page)).toHaveAccessibleName("Avisos, 2 sin leer");

  await campana(page).click();
  await page.waitForURL("**/empresa/avisos");
  await expect(
    page.getByText(`Ana Avisos se postuló a «${BUSQUEDA}».`),
  ).toBeVisible();
  await expect(
    page.getByText(`Ana Avisos se inscribió a «${EVENTO}».`),
  ).toBeVisible();

  // El enlace lleva a la postulación de esa persona.
  await page
    .getByRole("listitem")
    .filter({ hasText: "se postuló" })
    .getByRole("link")
    .click();
  await page.waitForURL(/\/empresa\/busquedas\/.+\/postulantes\//);
  await expect(page.getByText("Ana Avisos").first()).toBeVisible();

  // Solo la postulación encola correo, y el despacho no le escribe a un
  // dominio de prueba: lo cierra sin mandarlo.
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("correos_pendientes")
        .select("enviado_en, ultimo_error")
        .eq("cuenta_id", empresaId);
      return data?.map((c) => [Boolean(c.enviado_en), c.ultimo_error]);
    })
    .toEqual([[true, "omitido: sin dirección válida"]]);
});

test("el joven recibe un aviso claro al quedar seleccionado o descartado", async ({
  page,
}) => {
  // Beto se postula por la API; Ana ya se postuló en el test anterior.
  const { id: postulacionOtro } = await exigir(
    admin
      .from("postulaciones")
      .insert({ vacante_id: vacanteId, perfil_id: otroId })
      .select("id")
      .single(),
  );
  const { id: postulacionAna } = await exigir(
    admin
      .from("postulaciones")
      .select("id")
      .eq("perfil_id", elegidaId)
      .single(),
  );

  // La empresa selecciona a Ana desde su pantalla.
  await entrar(page, EMPRESA.email);
  await page.goto(
    `/empresa/busquedas/${vacanteId}/postulantes/${postulacionAna}`,
  );
  const boton = (nombre: string) =>
    page.getByRole("button", { name: nombre, exact: true });
  await boton("Seleccionar").click();
  await boton("Sí, seleccionar").click();
  await expect(page.getByText("Seleccionada").first()).toBeVisible();

  // Y descarta a Beto.
  await admin
    .from("postulaciones")
    .update({ estado: "rechazada" })
    .eq("id", postulacionOtro);

  await entrar(page, ELEGIDA.email);
  await expect(campana(page)).toHaveAccessibleName("Avisos, 1 sin leer");
  await campana(page).click();
  await page.waitForURL("**/avisos");
  const aviso = page
    .getByRole("listitem")
    .filter({ hasText: `Te seleccionaron en ${EMPRESA.razon}` });
  await expect(aviso).toBeVisible();
  await expect(page.getByText("aceptada")).toHaveCount(0);

  await aviso.getByRole("link").click();
  await page.waitForURL(`**/postulaciones#postulacion-${postulacionAna}`);
  await expect(page.locator(`#postulacion-${postulacionAna}`)).toBeVisible();
  await expect(page.locator(`#postulacion-${postulacionAna}`)).toContainText(
    BUSQUEDA,
  );

  await entrar(page, OTRO.email);
  await page.goto("/avisos");
  await expect(
    page.getByText(`Tu postulación a «${BUSQUEDA}» en ${EMPRESA.razon} no siguió adelante.`, {
      exact: false,
    }),
  ).toBeVisible();

  // Seleccionada y descartada encolan un correo cada una.
  const { count } = await admin
    .from("correos_pendientes")
    .select("id", { count: "exact", head: true })
    .in("cuenta_id", [elegidaId, otroId]);
  expect(count).toBe(2);
});
