import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * Interview Lab (migración 010).
 *
 * - Solo el joven lo tiene en el menú y puede entrar; la empresa y quien no
 *   tiene sesión, no.
 * - Mientras falta el test de personalidad, el inicio avisa; postularse
 *   sigue andando.
 * - El joven carga un test opcional (nace oculto y declarado), conserva lo
 *   escrito ante un error, lo muestra, lo oculta y lo borra; la barra cuenta.
 * - El perfil muestra la personalidad sin dejar editarla.
 * - La empresa ve en la ficha solo lo compartido, con «Declarado por el
 *   postulante», y la compatibilidad no cambia.
 * - Por la API: sin sesión y otra empresa no leen nada; el joven no puede
 *   marcar un resultado como verificado.
 *
 * Crea dos empresas y un joven descartables (dominio `.invalid`) con la
 * clave de servicio y los borra al terminar.
 */

process.loadEnvFile(".env.local");

const URL = process.env.SUPABASE_URL ?? "";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-E2E-2026!";
const EMPRESA = `e2e-lab-empresa-${sufijo}@linkyouth.invalid`;
const OTRA = `e2e-lab-otra-${sufijo}@linkyouth.invalid`;
const JOVEN = `e2e-lab-joven-${sufijo}@linkyouth.invalid`;
const ids: string[] = [];

let jovenId = "";
let vacanteId = "";
let otraVacanteId = "";
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

async function crearVacante(empresaId: string, titulo: string) {
  const [vacante] = await exigir(
    admin
      .from("vacantes")
      .insert({
        empresa_id: empresaId,
        titulo,
        descripcion: "Búsqueda de la suite e2e del Interview Lab.",
        tipo: "pasantia",
        posiciones: 1,
        modalidad: "remota",
      })
      .select("id"),
  );
  return vacante.id as string;
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

async function filaDeAptitudes() {
  const { data } = await admin
    .from("resultados_de_tests")
    .select("puntaje, resultado, visible_para_empresas, origen")
    .eq("perfil_id", jovenId)
    .eq("test", "aptitudes")
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

const seccionLab = (page: Page) =>
  page.locator("section", {
    has: page.getByRole("heading", { name: "Interview Lab", exact: true }),
  });

test.describe.configure({ mode: "serial", timeout: 60_000 });

test.beforeAll(async () => {
  const habilidades = await exigir(
    admin.from("habilidades").select("id, nombre").order("nombre").limit(2),
  );
  const empresaId = await crearEmpresa(EMPRESA, "Empresa Lab");
  await crearEmpresa(OTRA, "Otra Empresa Lab");

  jovenId = await crearCuenta(JOVEN);
  await exigir(
    admin.from("cuentas").insert({ id: jovenId, tipo: "individual" }),
  );
  await exigir(
    admin.from("perfiles").insert({
      id: jovenId,
      nombre_usuario: `e2e_lab_${sufijo}`,
      nombre: "Joven",
      apellido: "Laboratorio",
      fecha_nacimiento: "2003-02-11",
      pais: "Uruguay",
    }),
  );
  await exigir(
    admin
      .from("perfil_habilidades")
      .insert({ perfil_id: jovenId, habilidad_id: habilidades[0].id }),
  );

  vacanteId = await crearVacante(empresaId, `Búsqueda lab ${sufijo}`);
  otraVacanteId = await crearVacante(empresaId, `Otra búsqueda lab ${sufijo}`);
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

test("solo el joven tiene el Interview Lab en el menú y puede entrar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/empleos");
  await expect(page.getByRole("link", { name: "Interview Lab" })).toHaveCount(
    0,
  );
  await page.goto("/interview-lab");
  await expect(page).toHaveURL(/\/login/);

  await entrar(page, EMPRESA);
  await expect(page.getByRole("link", { name: "Interview Lab" })).toHaveCount(
    0,
  );
  await page.goto("/interview-lab");
  await expect(page).toHaveURL(/\/empresa/);

  await entrar(page, JOVEN);
  await page.getByRole("link", { name: "Interview Lab" }).first().click();
  await expect(page).toHaveURL(/\/interview-lab/);
  await expect(
    page.getByRole("heading", { name: "Interview Lab", level: 1 }),
  ).toBeVisible();
});

test("sin el obligatorio el inicio avisa, y postularse sigue andando", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/inicio");
  const aviso = page.getByRole("complementary", { name: "Interview Lab" });
  await expect(aviso).toContainText("Te falta el test de personalidad");
  await expect(aviso).toContainText("Podés postularte igual");

  await page.goto(`/empleos/${otraVacanteId}`);
  await page.getByRole("button", { name: "Postularme" }).first().click();
  await expect(
    page.getByRole("button", { name: /Ya te postulaste|Postulación enviada/ }),
  ).toBeVisible();
  const postulaciones = await exigir(
    admin
      .from("postulaciones")
      .select("id")
      .eq("vacante_id", otraVacanteId)
      .eq("perfil_id", jovenId),
  );
  expect(postulaciones).toHaveLength(1);
});

let compatibilidadSinResultados = "";

test("sin nada compartido, la ficha no tiene sección Interview Lab", async ({
  page,
}) => {
  compatibilidadSinResultados = await fichaDeLaEmpresa(page);
  await expect(seccionLab(page)).toHaveCount(0);
});

test("el joven carga un test opcional: nace oculto y conserva lo escrito ante un error", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/interview-lab");
  await expect(page.getByText("0 de 4 completados")).toBeVisible();

  const tarjeta = page.locator("#test-aptitudes");
  await expect(tarjeta.getByText("Pendiente", { exact: true })).toBeVisible();
  await expect(
    tarjeta.getByRole("link", { name: /Hacer el test/ }),
  ).toHaveAttribute("href", "https://jobcannon.io/es/tests/aptitude-test");

  await tarjeta.getByText("Cargar mi resultado").click();
  const puntaje = tarjeta.getByLabel("Nivel o puntaje (opcional)");
  const resultado = tarjeta.getByLabel("Resultado principal (opcional)");
  await expect(
    tarjeta.getByRole("checkbox", { name: /Mostrar a las empresas/ }),
  ).not.toBeChecked();

  // Un puntaje demasiado largo (el formulario lo corta; se manda igual).
  await puntaje.evaluate((el) => el.removeAttribute("maxlength"));
  await puntaje.fill("x".repeat(41));
  await resultado.fill("Fuerte en razonamiento lógico.");
  await tarjeta.getByRole("button", { name: "Guardar resultado" }).click();
  await expect(tarjeta.getByText(/Hasta 40 caracteres/).first()).toBeVisible();
  await expect(resultado).toHaveValue("Fuerte en razonamiento lógico.");
  expect(await filaDeAptitudes()).toBeNull();

  await puntaje.fill("24 de 30");
  await tarjeta.getByRole("button", { name: "Guardar resultado" }).click();
  await expect(tarjeta.getByText(/^Completado el /)).toBeVisible();
  await expect(page.getByText("1 de 4 completados")).toBeVisible();
  await expect(
    tarjeta.getByRole("switch", { name: /Mostrar a las empresas/ }),
  ).toHaveAttribute("aria-checked", "false");

  expect(await filaDeAptitudes()).toEqual({
    puntaje: "24 de 30",
    resultado: "Fuerte en razonamiento lógico.",
    visible_para_empresas: false,
    origen: "declarado",
  });
});

test("oculto: la empresa no lo ve, ni en la ficha ni por la API", async ({
  page,
}) => {
  const compatibilidad = await fichaDeLaEmpresa(page);
  await expect(seccionLab(page)).toHaveCount(0);
  expect(compatibilidad).toBe(compatibilidadSinResultados);

  const empresa = await clienteDe(EMPRESA);
  const { data } = await empresa
    .from("resultados_de_tests")
    .select("test")
    .eq("perfil_id", jovenId);
  expect(data ?? []).toEqual([]);
});

test("el joven lo muestra y la empresa lo ve declarado, sin cambiar la compatibilidad", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/interview-lab");
  const interruptor = page
    .locator("#test-aptitudes")
    .getByRole("switch", { name: /Mostrar a las empresas/ });
  await interruptor.click();
  await expect(interruptor).toHaveAttribute("aria-checked", "true");

  const compatibilidad = await fichaDeLaEmpresa(page);
  const lab = seccionLab(page);
  const fila = lab.locator('[data-test="aptitudes"]');
  await expect(fila.getByText("Test de aptitudes")).toBeVisible();
  await expect(fila.getByText("24 de 30")).toBeVisible();
  await expect(fila.getByText("Fuerte en razonamiento lógico.")).toBeVisible();
  await expect(fila.getByText(/Declarado por el postulante/)).toBeVisible();
  // La personalidad no está cargada: no aparece.
  await expect(lab.getByText("Personalidad")).toHaveCount(0);
  expect(compatibilidad).toBe(compatibilidadSinResultados);
});

test("por la API: sin sesión y otra empresa no leen; el joven no puede marcarlo verificado", async () => {
  for (const email of [OTRA, undefined]) {
    const cliente = await clienteDe(email);
    const { data } = await cliente
      .from("resultados_de_tests")
      .select("test")
      .eq("perfil_id", jovenId);
    expect(data ?? [], email ?? "anon").toEqual([]);
  }

  const joven = await clienteDe(JOVEN);
  const { error } = await joven
    .from("resultados_de_tests")
    .update({ origen: "verificado" } as never)
    .eq("perfil_id", jovenId);
  expect(error?.code).toBe("42501");
  expect((await filaDeAptitudes())?.origen).toBe("declarado");
});

test("el perfil muestra la personalidad sin dejar editarla", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/perfil");
  const seccion = page.locator("section", {
    has: page.getByRole("heading", { name: "Personalidad", exact: true }),
  });
  await expect(seccion.getByText("Sin completar")).toBeVisible();
  await expect(
    seccion.getByRole("link", { name: "Completar en Interview Lab" }),
  ).toHaveAttribute("href", "/interview-lab#test-personalidad");
  await expect(seccion.getByRole("combobox")).toHaveCount(0);
  await expect(seccion.getByRole("switch")).toHaveCount(0);
  await expect(seccion.getByRole("button")).toHaveCount(0);

  await exigir(
    admin
      .from("perfil_personalidad")
      .insert({ perfil_id: jovenId, tipo: "ISFP-A" }),
  );
  await page.reload();
  await expect(seccion.getByText("Aventurero")).toBeVisible();
  await expect(
    seccion.getByRole("link", { name: "Editar en Interview Lab" }),
  ).toHaveAttribute("href", "/interview-lab#test-personalidad");
  await expect(seccion.getByRole("combobox")).toHaveCount(0);
  await expect(seccion.getByRole("switch")).toHaveCount(0);
  await expect(seccion.getByRole("button")).toHaveCount(0);

  // Con el obligatorio cargado, el inicio deja de avisar.
  await page.goto("/inicio");
  await expect(
    page.getByRole("complementary", { name: "Interview Lab" }),
  ).toHaveCount(0);
  await page.goto("/interview-lab");
  await expect(page.getByText("2 de 4 completados")).toBeVisible();
});

test("el joven lo oculta y lo borra; la empresa deja de verlo", async ({
  page,
}) => {
  await entrar(page, JOVEN);
  await page.goto("/interview-lab");
  const tarjeta = page.locator("#test-aptitudes");
  const interruptor = tarjeta.getByRole("switch", {
    name: /Mostrar a las empresas/,
  });
  await interruptor.click();
  await expect(interruptor).toHaveAttribute("aria-checked", "false");

  const compatibilidad = await fichaDeLaEmpresa(page);
  await expect(seccionLab(page)).toHaveCount(0);
  expect(compatibilidad).toBe(compatibilidadSinResultados);

  await entrar(page, JOVEN);
  await page.goto("/interview-lab");
  await tarjeta.getByText("Cambiar resultado").click();
  await tarjeta.getByRole("button", { name: "Borrar resultado" }).click();
  await tarjeta.getByRole("button", { name: "Sí, borrarlo" }).click();
  await expect(tarjeta.getByText("Pendiente", { exact: true })).toBeVisible();
  expect(await filaDeAptitudes()).toBeNull();
});
