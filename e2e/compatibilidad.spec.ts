import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * Lo oculto de una búsqueda y la compatibilidad son solo de la empresa
 * (RF3.1.6, RF3.9.2, RNF5).
 *
 * - En la base: con la sesión del joven, y sin sesión, `vacante_tags_ocultos`
 *   y `vacante_habilidades_ocultas` no devuelven nada; con la de la empresa
 *   dueña, sí.
 * - En pantalla: el joven no ve lo oculto ni ninguna marca de coincidencia;
 *   la empresa ve la coincidencia en la ficha del postulante.
 * - En el formulario: la empresa marca una habilidad «Solo vos» y no aparece
 *   en la publicación.
 *
 * Crea una empresa y un joven descartables (dominio `.invalid`) con la clave
 * de servicio y los borra al terminar; la búsqueda y la postulación se van con
 * ellos por `on delete cascade`.
 */

process.loadEnvFile(".env.local");

const URL = process.env.SUPABASE_URL ?? "";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-E2E-2026!";
const EMPRESA = `e2e-compat-empresa-${sufijo}@linkyouth.invalid`;
const JOVEN = `e2e-compat-joven-${sufijo}@linkyouth.invalid`;
const TITULO = `Búsqueda con ocultos ${sufijo}`;
const ids: string[] = [];

type Opcion = { id: string; nombre: string };
let publica: Opcion;
let oculta: Opcion;
let tagOculto: Opcion;
let vacanteId = "";
let postulacionId = "";

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

async function exigir<T>(
  promesa: PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T> {
  // Un `insert` sin `select` devuelve `data: null` aunque salga bien: solo
  // el error cuenta como falla.
  const { data, error } = await promesa;
  if (error) throw error;
  return data as T;
}

/** Un cliente con la clave pública, como el navegador de cualquiera. */
async function clienteDe(email?: string) {
  const cliente = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (email) {
    const { error } = await cliente.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });
    if (error) throw error;
  }
  return cliente;
}

test.describe.configure({ mode: "serial", timeout: 60_000 });

test.beforeAll(async () => {
  const habilidades = await exigir(
    admin.from("habilidades").select("id, nombre").order("nombre").limit(3),
  );
  const tags = await exigir(
    admin.from("tags").select("id, nombre").order("nombre").limit(1),
  );
  [publica, oculta] = habilidades;
  [tagOculto] = tags;

  const empresaId = await crearCuenta(EMPRESA);
  await exigir(
    admin.from("cuentas").insert({ id: empresaId, tipo: "empresa" }),
  );
  await exigir(
    admin.from("empresas").insert({
      id: empresaId,
      razon_social: `Empresa Compat ${sufijo}`,
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
      nombre_usuario: `e2e_compat_${sufijo}`,
      nombre: "Joven",
      apellido: "Compatible",
      fecha_nacimiento: "2002-05-10",
      pais: "Uruguay",
    }),
  );
  // Declara las dos habilidades y el interés: si la pantalla del joven
  // marcara coincidencias, las marcaría.
  await exigir(
    admin.from("perfil_habilidades").insert([
      { perfil_id: jovenId, habilidad_id: publica.id },
      { perfil_id: jovenId, habilidad_id: oculta.id },
    ]),
  );
  await exigir(
    admin
      .from("perfil_tags")
      .insert({ perfil_id: jovenId, tag_id: tagOculto.id }),
  );

  const [vacante] = await exigir(
    admin
      .from("vacantes")
      .insert({
        empresa_id: empresaId,
        titulo: TITULO,
        descripcion:
          "Búsqueda de la suite e2e para comprobar que lo oculto no llega al joven.",
        tipo: "pasantia",
        posiciones: 1,
        modalidad: "remota",
      })
      .select("id"),
  );
  vacanteId = vacante.id;
  await exigir(
    admin
      .from("vacante_habilidades")
      .insert({ vacante_id: vacanteId, habilidad_id: publica.id }),
  );
  await exigir(
    admin
      .from("vacante_habilidades_ocultas")
      .insert({ vacante_id: vacanteId, habilidad_id: oculta.id }),
  );
  await exigir(
    admin
      .from("vacante_tags_ocultos")
      .insert({ vacante_id: vacanteId, tag_id: tagOculto.id }),
  );
  const [postulacion] = await exigir(
    admin
      .from("postulaciones")
      .insert({ vacante_id: vacanteId, perfil_id: jovenId })
      .select("id"),
  );
  postulacionId = postulacion.id;
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

test("RLS: lo oculto solo lo lee la empresa dueña (RNF5)", async () => {
  for (const email of [JOVEN, undefined]) {
    const cliente = await clienteDe(email);
    for (const tabla of [
      "vacante_tags_ocultos",
      "vacante_habilidades_ocultas",
    ] as const) {
      const { data } = await cliente
        .from(tabla)
        .select("*")
        .eq("vacante_id", vacanteId);
      // Sin permiso, PostgREST devuelve error o una lista vacía: nunca filas.
      expect(data ?? [], `${tabla} con ${email ?? "anon"}`).toEqual([]);
    }
  }

  const empresa = await clienteDe(EMPRESA);
  const { data: tags } = await empresa
    .from("vacante_tags_ocultos")
    .select("tag_id")
    .eq("vacante_id", vacanteId);
  const { data: habilidades } = await empresa
    .from("vacante_habilidades_ocultas")
    .select("habilidad_id")
    .eq("vacante_id", vacanteId);
  expect(tags).toEqual([{ tag_id: tagOculto.id }]);
  expect(habilidades).toEqual([{ habilidad_id: oculta.id }]);
});

test("el joven no ve lo oculto ni ninguna coincidencia (RF3.9.2)", async ({
  page,
}) => {
  await entrar(page, JOVEN);

  // Solo la tarjeta o el detalle de esta búsqueda: otras del listado pueden
  // pedir públicamente las mismas habilidades.
  for (const ruta of [`/empleos/${vacanteId}`, "/empleos"]) {
    await page.goto(ruta);
    const tarjeta = page.locator("article", { hasText: TITULO }).first();
    await expect(tarjeta).toBeVisible();
    const html = await tarjeta.innerHTML();
    expect(html, ruta).not.toContain(oculta.nombre);
    expect(html, ruta).not.toContain(tagOculto.nombre);
    expect(html, ruta).not.toMatch(/Tenés \d+ de \d+/);
    expect(html, ruta).not.toContain("ya lo tenés");
    expect(html, ruta).not.toContain("La que más coincide");
    expect(html, ruta).not.toContain("Te falta");
  }

  // La habilidad pública sí se muestra, sin marca.
  await page.goto(`/empleos/${vacanteId}`);
  await expect(page.getByText(publica.nombre).first()).toBeVisible();
});

test("la empresa ve la coincidencia en la ficha del postulante (RF3.9)", async ({
  page,
}) => {
  await entrar(page, EMPRESA);
  await page.goto(
    `/empresa/busquedas/${vacanteId}/postulantes/${postulacionId}`,
  );
  await expect(
    page.getByText("Declara 2 de 2 habilidades pedidas").first(),
  ).toBeVisible();
  await expect(page.getByText("1 de 1 interés clave").first()).toBeVisible();

  await page.goto(`/empresa/busquedas/${vacanteId}`);
  await page.getByText("Lo que publicaste").click();
  const publicado = page.locator("details", { hasText: "Lo que publicaste" });
  await expect(publicado.getByText("Habilidades ocultas")).toBeVisible();
  await expect(publicado.getByText(oculta.nombre)).toBeVisible();
});

test("la empresa marca una habilidad «Solo vos» y no se publica (RF3.1.6)", async ({
  page,
}) => {
  const titulo = `Con habilidad oculta ${sufijo}`;
  await entrar(page, EMPRESA);
  await page.goto("/empresa/busquedas/nueva");

  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Modalidad").selectOption("remota");
  await page
    .getByLabel("Descripción")
    .fill(
      "Buscamos a alguien con ganas de aprender, con o sin experiencia previa.",
    );
  const grupo = page.getByRole("group", { name: "Habilidades que pedís" });
  await grupo
    .getByRole("button", { name: publica.nombre, exact: true })
    .click();
  await grupo.getByRole("button", { name: oculta.nombre, exact: true }).click();
  await page
    .getByRole("group", { name: `Quién ve «${oculta.nombre}»` })
    .getByText("Solo vos")
    .click();
  await page.getByRole("button", { name: "Publicar búsqueda" }).click();
  await page.waitForURL(/\/empresa\/busquedas\/[0-9a-f-]{36}(\?|$)/);
  const id = page.url().match(/busquedas\/([0-9a-f-]{36})/)![1];

  const ocultas = await exigir(
    admin
      .from("vacante_habilidades_ocultas")
      .select("habilidad_id")
      .eq("vacante_id", id),
  );
  const publicas = await exigir(
    admin
      .from("vacante_habilidades")
      .select("habilidad_id")
      .eq("vacante_id", id),
  );
  expect(ocultas).toEqual([{ habilidad_id: oculta.id }]);
  expect(publicas).toEqual([{ habilidad_id: publica.id }]);

  // Sin sesión, la publicación no la menciona.
  await page.context().clearCookies();
  await page.goto(`/empleos/${id}`);
  await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
  expect(await page.content()).not.toContain(oculta.nombre);
});
