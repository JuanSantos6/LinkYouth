import { createClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";

/**
 * Nivel 2 del cierre: formación (RF2.4), avisos leídos (RF6.1), perfil
 * público de persona (RF2.5), perfil público de empresa con reseñas (RF8.1,
 * RF8.2) y ajustes de cuenta (RF1.5, RF1.7).
 *
 * Escribe en la base: crea una empresa con una búsqueda y dos jóvenes
 * descartables (`.invalid`) y los borra al terminar, con todo lo suyo en
 * cascada.
 */

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sufijo = Date.now().toString(36);
const PASSWORD = "Prueba-Nivel2-2026!";
const NUEVA = "Nueva-Nivel2-2026!";
const EMPRESA = {
  email: `e2e-n2-empresa-${sufijo}@linkyouth.invalid`,
  razon: `Empresa N2 ${sufijo}`,
};
const JOVEN = {
  email: `e2e-n2-joven-${sufijo}@linkyouth.invalid`,
  usuario: `e2e_n2_${sufijo}`,
};
const OTRO = {
  email: `e2e-n2-otro-${sufijo}@linkyouth.invalid`,
  usuario: `e2e_n2o_${sufijo}`,
};
const ids: string[] = [];
let empresaId = "";
let jovenId = "";
let otroId = "";

async function exigir<R extends { data: unknown; error: unknown }>(
  promesa: PromiseLike<R>,
): Promise<NonNullable<R["data"]>> {
  const { data, error } = await promesa;
  if (error) throw error;
  return data as NonNullable<R["data"]>;
}

async function crearJoven(email: string, usuario: string, apellido: string) {
  const { user } = await exigir(
    admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    }),
  );
  const id = user!.id;
  ids.push(id);
  await exigir(admin.from("cuentas").insert({ id, tipo: "individual" }));
  await exigir(
    admin.from("perfiles").insert({
      id,
      nombre_usuario: usuario,
      nombre: "Prueba",
      apellido,
      fecha_nacimiento: "2001-06-01",
      pais: "Uruguay",
      bio: "Me gusta aprender cosas nuevas.",
    }),
  );
  return id;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const { user } = await exigir(
    admin.auth.admin.createUser({
      email: EMPRESA.email,
      password: PASSWORD,
      email_confirm: true,
    }),
  );
  empresaId = user!.id;
  ids.push(empresaId);
  await exigir(
    admin.from("cuentas").insert({ id: empresaId, tipo: "empresa" }),
  );
  await exigir(
    admin.from("empresas").insert({
      id: empresaId,
      razon_social: EMPRESA.razon,
      rubro: "Pruebas",
      descripcion: "Empresa de la suite e2e del Nivel 2.",
    }),
  );
  const vacante = await exigir(
    admin
      .from("vacantes")
      .insert({
        empresa_id: empresaId,
        titulo: `Búsqueda N2 ${sufijo}`,
        descripcion: "Búsqueda de prueba.",
        tipo: "empleo",
        posiciones: 2,
        modalidad: "remota",
      })
      .select("id")
      .single(),
  );

  jovenId = await crearJoven(JOVEN.email, JOVEN.usuario, "ApellidoPrivado");
  otroId = await crearJoven(OTRO.email, OTRO.usuario, "Otro");
  await exigir(
    admin
      .from("postulaciones")
      .insert({ vacante_id: vacante.id, perfil_id: jovenId }),
  );
  await exigir(
    admin.from("notificaciones").insert([
      { cuenta_id: jovenId, tipo: "prueba", mensaje: `Aviso uno ${sufijo}` },
      { cuenta_id: jovenId, tipo: "prueba", mensaje: `Aviso dos ${sufijo}` },
    ]),
  );
});

test.afterAll(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});

async function entrar(page: Page, usuario: string, password = PASSWORD) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(usuario);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(inicio|empresa)/, { timeout: 20_000 });
}

test("agrega y quita un estudio (RF2.4)", async ({ page }) => {
  await entrar(page, JOVEN.usuario);
  await page.goto("/perfil");
  await page.getByLabel("Institución").fill(`Instituto ${sufijo}`);
  await page.getByLabel("Título o carrera").fill("Tecnólogo en Informática");
  await page.getByLabel("Estado").selectOption("en_curso");
  await page.getByRole("button", { name: "Agregar estudio" }).click();
  await expect(page.getByText(`Instituto ${sufijo}`).first()).toBeVisible();

  await page.getByRole("button", { name: "Quitar", exact: true }).click();
  await page.getByRole("button", { name: "Sí, quitar" }).click();
  await expect(page.getByText(`Instituto ${sufijo}`)).toHaveCount(0, {
    timeout: 10_000,
  });
});

test("marca todos los avisos como leídos (RF6.1)", async ({ page }) => {
  await entrar(page, JOVEN.usuario);
  await page.goto("/avisos");
  await page.getByRole("button", { name: "Marcar todo como leído" }).click();
  await expect
    .poll(async () => {
      const { count } = await admin
        .from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("cuenta_id", jovenId)
        .eq("leida", false);
      return count;
    })
    .toBe(0);
});

test("el perfil público muestra usuario e intereses, no datos personales (RF2.5)", async ({
  page,
}) => {
  await entrar(page, OTRO.usuario);
  await page.goto(`/personas/${JOVEN.usuario}`);
  await expect(
    page.getByRole("heading", { name: `@${JOVEN.usuario}` }),
  ).toBeVisible();
  await expect(page.getByText("Me gusta aprender cosas nuevas.")).toBeVisible();
  await expect(page.getByText("ApellidoPrivado")).toHaveCount(0);
});

test("la empresa muestra sus reseñas sin autor y el joven publica la suya (RF8.1, RF8.2)", async ({
  page,
}) => {
  await exigir(
    admin.from("resenias").insert({
      empresa_id: empresaId,
      perfil_id: otroId,
      calificacion: 3,
      comentario: `Reseña previa ${sufijo}, sin nombre.`,
    }),
  );

  // Sin sesión se ve la ficha y la reseña, sin quién la escribió.
  await page.context().clearCookies();
  await page.goto(`/organizaciones/${empresaId}`);
  await expect(
    page.getByRole("heading", { name: EMPRESA.razon }),
  ).toBeVisible();
  await expect(page.getByText(`Reseña previa ${sufijo}`)).toBeVisible();
  await expect(page.getByText(OTRO.usuario)).toHaveCount(0);

  // El joven que se postuló la reseña.
  await entrar(page, JOVEN.usuario);
  await page.goto(`/organizaciones/${empresaId}`);
  await page.getByRole("radio", { name: "4 estrellas" }).check({ force: true });
  await page
    .getByLabel("Tu experiencia")
    .fill(`Me respondieron rápido y la entrevista fue clara ${sufijo}.`);
  await page.getByRole("button", { name: "Publicar reseña" }).click();
  await expect(
    page.getByText(`la entrevista fue clara ${sufijo}`).first(),
  ).toBeVisible();
});

test("cambia el nombre de usuario y la contraseña (RF1.5)", async ({
  page,
}) => {
  await entrar(page, JOVEN.usuario);
  await page.goto("/ajustes");

  const formUsuario = page.locator("form", {
    has: page.getByRole("button", { name: "Guardar nombre de usuario" }),
  });
  JOVEN.usuario = `${JOVEN.usuario}_b`;
  await formUsuario.getByLabel("Nombre de usuario").fill(JOVEN.usuario);
  await formUsuario
    .getByRole("button", { name: "Guardar nombre de usuario" })
    .click();
  await expect(formUsuario.getByText(/nombre de usuario nuevo/)).toBeVisible();

  const formClave = page.locator("form", {
    has: page.getByRole("button", { name: "Cambiar contraseña" }),
  });
  await formClave.getByLabel("Contraseña actual").fill(PASSWORD);
  await formClave.getByLabel("Contraseña", { exact: true }).fill(NUEVA);
  await formClave.getByLabel("Repetir la contraseña").fill(NUEVA);
  await formClave.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(
    formClave.getByText("Listo, tu contraseña cambió."),
  ).toBeVisible();

  await entrar(page, JOVEN.usuario, NUEVA);
  await expect(page).toHaveURL(/\/inicio/);
});

test("elimina la cuenta: anonimiza, cancela lo pendiente y no deja entrar (RF1.7)", async ({
  page,
}) => {
  await entrar(page, JOVEN.usuario, NUEVA);
  await page.goto("/ajustes");
  const form = page.locator("form", {
    has: page.getByRole("button", { name: "Eliminar la cuenta" }),
  });
  await form.getByLabel("Contraseña actual").fill(NUEVA);
  await form.getByLabel("Escribí ELIMINAR para confirmar").fill("ELIMINAR");
  await form.getByRole("button", { name: "Eliminar la cuenta" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 });

  const perfil = await exigir(
    admin
      .from("perfiles")
      .select("nombre, apellido, bio")
      .eq("id", jovenId)
      .single(),
  );
  expect(perfil).toEqual({
    nombre: "Cuenta",
    apellido: "eliminada",
    bio: null,
  });
  const postulaciones = await exigir(
    admin.from("postulaciones").select("estado").eq("perfil_id", jovenId),
  );
  expect(postulaciones.map((p) => p.estado)).toEqual(["cancelada"]);
  const resenias = await exigir(
    admin.from("resenias").select("id").eq("perfil_id", jovenId),
  );
  expect(resenias).toHaveLength(1);

  await page.goto("/login");
  await page.getByLabel("Correo o nombre de usuario").fill(JOVEN.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(NUEVA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByText("El usuario o la contraseña no son correctos."),
  ).toBeVisible();
});
