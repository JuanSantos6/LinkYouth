import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * Resultado del test de personalidad (migración 009).
 *
 * - El joven lo carga eligiéndolo de la lista, nace oculto, lo muestra, lo
 *   oculta y lo borra.
 * - La empresa a la que se postuló lo ve en la ficha solo mientras está
 *   visible, con «Declarado por el postulante».
 * - Otra empresa y quien no tiene sesión no lo leen nunca, ni por la API.
 * - La compatibilidad que ve la empresa es la misma con y sin resultado.
 *
 * Crea una empresa, otra empresa y un joven descartables (dominio `.invalid`)
 * con la clave de servicio y los borra al terminar.
 */

process.loadEnvFile(".env.local");

const URL = process.env.SUPABASE_URL ?? "";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-E2E-2026!";
const EMPRESA = `e2e-perso-empresa-${sufijo}@linkyouth.invalid`;
const OTRA = `e2e-perso-otra-${sufijo}@linkyouth.invalid`;
const JOVEN = `e2e-perso-joven-${sufijo}@linkyouth.invalid`;
const ids: string[] = [];

let jovenId = "";
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
  const { data, error } = await promesa;
  if (error) throw error;
  return data as T;
}

async function crearEmpresa(email: string, nombre: string) {
  const id = await crearCuenta(email);
  await exigir(admin.from("cuentas").insert({ id, tipo: "empresa" }));
  await exigir(
    admin.from("empresas").insert({
      id,
      razon_social: `${nombre} ${sufijo}`,
      rubro: "Tecnología",
      descripcion: "Empresa creada por la suite e2e. Se borra al terminar.",
    }),
  );
  return id;
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

async function filaDelJoven() {
  const { data } = await admin
    .from("perfil_personalidad")
    .select("tipo, visible_para_empresas")
    .eq("perfil_id", jovenId)
    .maybeSingle();
  return data;
}

async function entrar(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(empresa|inicio)/);
}

/** La ficha del postulante: devuelve el texto de la compatibilidad. */
async function fichaDeLaEmpresa(page: Page) {
  await entrar(page, EMPRESA);
  await page.goto(
    `/empresa/busquedas/${vacanteId}/postulantes/${postulacionId}`,
  );
  const compatibilidad = page.locator("section", {
    has: page.getByRole("heading", { name: "Compatibilidad" }),
  });
  await expect(compatibilidad).toBeVisible();
  return (await compatibilidad.innerText()).trim();
}

test.describe.configure({ mode: "serial", timeout: 60_000 });

test.beforeAll(async () => {
  const habilidades = await exigir(
    admin.from("habilidades").select("id, nombre").order("nombre").limit(2),
  );

  const empresaId = await crearEmpresa(EMPRESA, "Empresa Personalidad");
  await crearEmpresa(OTRA, "Otra Empresa Personalidad");

  jovenId = await crearCuenta(JOVEN);
  await exigir(
    admin.from("cuentas").insert({ id: jovenId, tipo: "individual" }),
  );
  await exigir(
    admin.from("perfiles").insert({
      id: jovenId,
      nombre_usuario: `e2e_perso_${sufijo}`,
      nombre: "Joven",
      apellido: "Personalidad",
      fecha_nacimiento: "2003-02-11",
      pais: "Uruguay",
    }),
  );
  await exigir(
    admin
      .from("perfil_habilidades")
      .insert({ perfil_id: jovenId, habilidad_id: habilidades[0].id }),
  );

  const [vacante] = await exigir(
    admin
      .from("vacantes")
      .insert({
        empresa_id: empresaId,
        titulo: `Búsqueda personalidad ${sufijo}`,
        descripcion: "Búsqueda de la suite e2e del test de personalidad.",
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
      .insert(
        habilidades.map((h) => ({ vacante_id: vacanteId, habilidad_id: h.id })),
      ),
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

let compatibilidadSinResultado = "";

test("sin resultado, la empresa no ve ninguna sección de personalidad", async ({
  page,
}) => {
  compatibilidadSinResultado = await fichaDeLaEmpresa(page);
  expect(compatibilidadSinResultado).toContain("Declara 1 de 2");
  await expect(
    page.getByRole("heading", { name: "Personalidad", exact: true }),
  ).toHaveCount(0);
});

test("el joven carga su resultado de la lista y nace oculto", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/perfil");

  const seccion = page.locator("section", {
    has: page.getByRole("heading", { name: "Personalidad (opcional)" }),
  });
  await expect(seccion.getByText("Sin completar")).toBeVisible();
  await expect(
    seccion.getByText(
      "Es un resultado que cargás vos. LinkYouth no lo valida y no lo usa para calcular tu compatibilidad.",
    ),
  ).toBeVisible();
  const test16 = seccion.getByRole("link", { name: /Hacer el test/ });
  await expect(test16).toHaveAttribute(
    "href",
    "https://www.16personalities.com/es",
  );
  await expect(test16).toHaveAttribute("target", "_blank");

  // No se escribe: se elige.
  await seccion.getByLabel("Tu tipo").selectOption("INTJ");
  await seccion.getByRole("radio", { name: /-T/ }).check();
  const vista = seccion.locator('[data-personalidad="INTJ-T"]');
  await expect(vista.getByText("Arquitecto")).toBeVisible();
  await expect(
    seccion.getByRole("checkbox", {
      name: /Mostrar a las empresas a las que me postulo/,
    }),
  ).not.toBeChecked();

  await seccion.getByRole("button", { name: "Guardar resultado" }).click();
  await expect(seccion.getByText("Completado")).toBeVisible();
  await expect(
    seccion.getByRole("switch", { name: /Mostrar a las empresas/ }),
  ).toHaveAttribute("aria-checked", "false");

  expect(await filaDelJoven()).toEqual({
    tipo: "INTJ-T",
    visible_para_empresas: false,
  });
});

test("oculto: la empresa no lo ve, ni en la ficha ni por la API", async ({
  page,
}) => {
  await fichaDeLaEmpresa(page);
  await expect(
    page.getByRole("heading", { name: "Personalidad", exact: true }),
  ).toHaveCount(0);

  const empresa = await clienteDe(EMPRESA);
  const { data } = await empresa
    .from("perfil_personalidad")
    .select("tipo")
    .eq("perfil_id", jovenId);
  expect(data ?? []).toEqual([]);
});

test("el joven lo muestra y la empresa lo ve, sin cambiar la compatibilidad", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/perfil");
  const interruptor = page.getByRole("switch", {
    name: /Mostrar a las empresas/,
  });
  await interruptor.click();
  await expect(interruptor).toHaveAttribute("aria-checked", "true");
  expect((await filaDelJoven())?.visible_para_empresas).toBe(true);

  const compatibilidad = await fichaDeLaEmpresa(page);
  const seccion = page.locator("section", {
    has: page.getByRole("heading", { name: "Personalidad", exact: true }),
  });
  await expect(seccion.getByText("Arquitecto")).toBeVisible();
  await expect(seccion.getByText("INTJ-T")).toBeVisible();
  await expect(seccion.getByText("Declarado por el postulante")).toBeVisible();
  expect(compatibilidad).toBe(compatibilidadSinResultado);
});

test("visible: otra empresa y quien no tiene sesión no lo leen", async () => {
  for (const email of [OTRA, undefined]) {
    const cliente = await clienteDe(email);
    const { data } = await cliente
      .from("perfil_personalidad")
      .select("tipo")
      .eq("perfil_id", jovenId);
    expect(data ?? [], email ?? "anon").toEqual([]);
  }
});

test("el joven lo oculta y la empresa deja de verlo", async ({ page }) => {
  await entrar(page, JOVEN);
  await page.goto("/perfil");
  const interruptor = page.getByRole("switch", {
    name: /Mostrar a las empresas/,
  });
  await interruptor.click();
  await expect(interruptor).toHaveAttribute("aria-checked", "false");

  const compatibilidad = await fichaDeLaEmpresa(page);
  await expect(
    page.getByRole("heading", { name: "Personalidad", exact: true }),
  ).toHaveCount(0);
  expect(compatibilidad).toBe(compatibilidadSinResultado);
});

test("el joven cambia el tipo y después lo borra", async ({ page }) => {
  await entrar(page, JOVEN);
  await page.goto("/perfil");
  const seccion = page.locator("section", {
    has: page.getByRole("heading", { name: "Personalidad (opcional)" }),
  });

  await seccion.getByText("Cambiar resultado").click();
  await seccion.getByLabel("Tu tipo").selectOption("ENFP");
  await seccion.getByRole("radio", { name: /-A/ }).check();
  await seccion.getByRole("button", { name: "Guardar resultado" }).click();
  // La vista previa ya dice «Activista» antes de guardar: se espera la
  // confirmación del servidor, no la insignia.
  await expect(
    seccion.getByText("Guardaste tu resultado: Activista (ENFP-A)."),
  ).toBeVisible();
  // Cambiar el tipo no cambia lo que decidió sobre mostrarlo.
  expect(await filaDelJoven()).toEqual({
    tipo: "ENFP-A",
    visible_para_empresas: false,
  });

  // «Cambiar resultado» sigue abierto después de guardar.
  await seccion.getByRole("button", { name: "Borrar resultado" }).click();
  await seccion.getByRole("button", { name: "Sí, borrarlo" }).click();
  await expect(seccion.getByText("Sin completar")).toBeVisible();
  expect(await filaDelJoven()).toBeNull();
});
