#!/usr/bin/env node
/**
 * Carga de la demo de LinkYouth: borra todas las cuentas y vuelve a crear las
 * del archivo `scripts/demo/contenido.json`. Se puede repetir: es lo que
 * restaura la demo si algo se rompe el día de la defensa.
 *
 *   node scripts/demo/sembrar.mjs --validar
 *       Solo comprueba el contenido. No toca la base.
 *   node scripts/demo/sembrar.mjs --contar
 *       Muestra cuánto hay en la base hoy (lo que se borraría). No toca nada.
 *   node scripts/demo/sembrar.mjs --borrar-todo --confirmo \
 *       [--correo-demo-joven=…] [--correo-demo-empresa=…]
 *       BORRA TODAS LAS CUENTAS (auth.users y, en cascada, todo lo suyo) y
 *       las imágenes del bucket `avatars`, y carga el contenido con sus fotos
 *       de Unsplash (`scripts/fotos/fotos.json`, sin consultar la API).
 *       Irreversible: antes, `~/bin/respaldo-linkyouth.sh`.
 *
 * Usa la clave de servicio de `.env.local`, que saltea RLS. Los disparadores
 * de la base sí corren: las postulaciones avanzan por el mismo camino que en
 * la aplicación (pendiente → en revisión → …), así que los avisos al joven y
 * el cierre de búsquedas salen de la base, como en producción.
 *
 * Contraseñas: las de las dos cuentas demo y una común para el resto se
 * guardan en ~/LinkYouth-credenciales-demo.txt (600), nunca en el
 * repositorio. Si el archivo ya existe se reutilizan, así una recarga no
 * cambia las credenciales que se anotaron para la defensa.
 */
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { cargarFotos } from "../fotos/cargar.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..", "..");
const CREDENCIALES = join(homedir(), "LinkYouth-credenciales-demo.txt");
const BUCKET = "avatars";

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);

process.loadEnvFile(join(RAIZ, ".env.local"));
const URL_SUPABASE = process.env.SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SUPABASE || !CLAVE) {
  console.error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}
const db = createClient(URL_SUPABASE, CLAVE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const contenido = JSON.parse(
  readFileSync(join(AQUI, "contenido.json"), "utf8"),
);

// ── utilidades ─────────────────────────────────────────────────────────────

function fallar(mensaje) {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}

async function exigir(promesa, que) {
  const { data, error } = await promesa;
  if (error) fallar(`${que}: ${error.message}`);
  return data;
}

function clave() {
  // 16 caracteres con mayúscula, minúscula y número: cumple FuerzaDeContrasenia.
  return `Ly-${randomBytes(9).toString("base64url")}9a`;
}

function diasAtras(dias, horas = 0) {
  return new Date(Date.now() - (dias * 24 + horas) * 3600 * 1000).toISOString();
}

/** Fecha y hora de Montevideo (UTC−3, sin horario de verano) a ISO. */
function fechaMontevideo(enDias, hora) {
  const base = new Date(Date.now() + enDias * 24 * 3600 * 1000);
  const dia = new Date(base.getTime() - 3 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  return new Date(`${dia}T${hora}:00-03:00`).toISOString();
}

// Imágenes de la demo (docs/imagenes.md). Los logos son dibujos propios en
// SVG (`logos/<clave>.svg`) y se suben a Storage. Las fotos de las personas,
// las portadas de las empresas y las de los eventos son de Unsplash por
// hotlink: las pone `cargarFotos` al final, desde `scripts/fotos/fotos.json`.
// Quien no tiene foto ve el avatar automático con sus iniciales.
const LOGOS = join(AQUI, "logos");

/** El logo SVG de una empresa, como WebP de 512 px. */
async function logoDe(clave) {
  const svg = join(LOGOS, `${clave}.svg`);
  if (!existsSync(svg)) fallar(`Falta el logo ${svg}`);
  return sharp(readFileSync(svg), { density: 300 })
    .resize(512, 512)
    .webp({ quality: 90 })
    .toBuffer();
}

async function subirImagen(usuarioId, nombre, webp) {
  const camino = `${usuarioId}/${nombre}.webp`;
  await exigir(
    db.storage.from(BUCKET).upload(camino, webp, {
      contentType: "image/webp",
      upsert: true,
    }),
    `subir ${camino}`,
  );
  // Ruta relativa, como la guarda la aplicación (ver `rutaDeImagen`).
  return new URL(db.storage.from(BUCKET).getPublicUrl(camino).data.publicUrl)
    .pathname;
}

// ── validación ─────────────────────────────────────────────────────────────

async function catalogos() {
  const tags = await exigir(db.from("tags").select("id, nombre"), "tags");
  const habilidades = await exigir(
    db.from("habilidades").select("id, nombre"),
    "habilidades",
  );
  return {
    tags: new Map(tags.map((t) => [t.nombre, t.id])),
    habilidades: new Map(habilidades.map((h) => [h.nombre, h.id])),
  };
}

function validar({ tags, habilidades }) {
  const c = contenido;
  const errores = [];
  const porClave = (lista, nombre) => {
    const m = new Map();
    for (const x of lista) {
      if (m.has(x.clave)) errores.push(`${nombre}: clave repetida ${x.clave}`);
      m.set(x.clave, x);
    }
    return m;
  };
  const empresas = porClave(c.empresas, "empresas");
  const jovenes = porClave(c.jovenes, "jovenes");
  const vacantes = porClave(c.vacantes, "vacantes");
  const eventos = porClave(c.eventos, "eventos");

  const unicos = (lista, campo, nombre) => {
    const vistos = new Set();
    for (const x of lista) {
      const v = String(x[campo]).toLowerCase();
      if (vistos.has(v))
        errores.push(`${nombre}: ${campo} repetido «${x[campo]}»`);
      vistos.add(v);
    }
  };
  unicos(c.empresas, "razon_social", "empresas");
  unicos(c.empresas, "rut", "empresas");
  unicos([...c.empresas, ...c.jovenes], "email", "cuentas");
  unicos(c.jovenes, "nombre_usuario", "jovenes");

  if (c.empresas.filter((e) => e.demo).length !== 1)
    errores.push("tiene que haber exactamente una empresa demo");
  if (c.jovenes.filter((j) => j.demo).length !== 1)
    errores.push("tiene que haber exactamente un joven demo");

  const enCatalogo = (nombres, mapa, que, donde) => {
    for (const n of nombres ?? [])
      if (!mapa.has(n))
        errores.push(`${donde}: ${que} fuera del catálogo «${n}»`);
  };
  for (const e of c.empresas) {
    if (!/^21\d{10}$/.test(e.rut)) errores.push(`${e.clave}: RUT inválido`);
  }
  for (const j of c.jovenes) {
    enCatalogo(j.tags, tags, "tag", j.clave);
    enCatalogo(j.habilidades, habilidades, "habilidad", j.clave);
    if ((j.tags ?? []).length < 5)
      errores.push(`${j.clave}: menos de 5 intereses`);
    const edad = (Date.now() - Date.parse(j.fecha_nacimiento)) / 31_557_600_000;
    if (edad < 18) errores.push(`${j.clave}: menor de 18`);
    if (!/^[a-z0-9._]+$/.test(j.nombre_usuario))
      errores.push(`${j.clave}: nombre de usuario inválido`);
    // Resultado del test de personalidad (migración 009): el mismo `check`
    // de la base.
    if (j.personalidad) {
      if (!/^[EI][SN][TF][JP]-[AT]$/.test(j.personalidad.tipo))
        errores.push(`${j.clave}: tipo de personalidad inválido`);
      if (typeof j.personalidad.visible !== "boolean")
        errores.push(`${j.clave}: falta si la personalidad es visible`);
    }
  }
  // Tests opcionales del Interview Lab (migración 010): los mismos `check`
  // de la base.
  for (const j of c.jovenes) {
    const vistos = new Set();
    for (const t of j.tests ?? []) {
      if (!["psicometrico", "juicio_situacional", "aptitudes"].includes(t.test))
        errores.push(`${j.clave}: test desconocido «${t.test}»`);
      if (vistos.has(t.test))
        errores.push(`${j.clave}: test repetido ${t.test}`);
      vistos.add(t.test);
      if ((t.puntaje ?? "").length > 40)
        errores.push(
          `${j.clave}: puntaje de ${t.test} de más de 40 caracteres`,
        );
      if ((t.resultado ?? "").length > 280)
        errores.push(
          `${j.clave}: resultado de ${t.test} de más de 280 caracteres`,
        );
      if (typeof t.visible !== "boolean")
        errores.push(`${j.clave}: falta si ${t.test} es visible`);
    }
  }
  // Los tres casos de los tests: compartidos (la joven demo, siempre),
  // cargados pero ocultos, y sin hacer.
  const tests = c.jovenes.flatMap((j) => j.tests ?? []);
  if (!(c.jovenes.find((j) => j.demo)?.tests ?? []).some((t) => t.visible))
    errores.push("la joven demo tiene que tener algún test compartido");
  if (!tests.some((t) => !t.visible))
    errores.push("ningún test cargado y oculto");
  if (c.jovenes.every((j) => (j.tests ?? []).length))
    errores.push("todos los jóvenes tienen tests: falta «sin hacer»");
  // La demo muestra los tres casos: compartido (la joven demo, siempre),
  // cargado pero oculto, y sin completar.
  const conPersonalidad = c.jovenes.filter((j) => j.personalidad);
  if (!c.jovenes.find((j) => j.demo)?.personalidad?.visible)
    errores.push("la joven demo tiene que tener la personalidad compartida");
  if (!conPersonalidad.some((j) => !j.personalidad.visible))
    errores.push("ningún joven tiene la personalidad cargada y oculta");
  if (conPersonalidad.length === c.jovenes.length)
    errores.push(
      "todos los jóvenes tienen personalidad: falta «sin completar»",
    );
  const titulos = new Set();
  for (const v of c.vacantes) {
    if (!empresas.has(v.empresa))
      errores.push(`${v.clave}: empresa ${v.empresa} no existe`);
    enCatalogo(v.habilidades, habilidades, "habilidad", v.clave);
    enCatalogo(v.tags, tags, "tag", v.clave);
    enCatalogo(v.tagsOcultos, tags, "tag oculto", v.clave);
    if (!(v.habilidades ?? []).length)
      errores.push(`${v.clave}: sin habilidades`);
    const t = `${v.empresa}|${v.titulo.trim().toLowerCase()}`;
    if (titulos.has(t))
      errores.push(`${v.clave}: título repetido en la empresa`);
    titulos.add(t);
    if (v.modalidad !== "remota" && !v.ubicacion)
      errores.push(`${v.clave}: falta la ubicación`);
  }
  const pares = new Set();
  const aceptadas = new Map();
  for (const p of c.postulaciones) {
    if (!jovenes.has(p.joven))
      errores.push(`postulación: joven ${p.joven} no existe`);
    if (!vacantes.has(p.vacante))
      errores.push(`postulación: vacante ${p.vacante} no existe`);
    const k = `${p.joven}|${p.vacante}`;
    if (pares.has(k)) errores.push(`postulación repetida ${k}`);
    pares.add(k);
    if (p.estado === "aceptada")
      aceptadas.set(p.vacante, (aceptadas.get(p.vacante) ?? 0) + 1);
  }
  for (const [v, n] of aceptadas) {
    if (vacantes.has(v) && n >= vacantes.get(v).posiciones)
      errores.push(
        `${v}: ${n} aceptadas cubren las posiciones y la base la cerraría`,
      );
  }
  for (const e of c.eventos) {
    if (!empresas.has(e.empresa))
      errores.push(`${e.clave}: empresa ${e.empresa} no existe`);
    enCatalogo(e.tags, tags, "tag", e.clave);
    if (!/^\d{2}:\d{2}$/.test(e.hora))
      errores.push(`${e.clave}: hora inválida`);
  }
  const insc = new Set();
  for (const i of c.inscripciones) {
    const ev = eventos.get(i.evento);
    if (!ev) errores.push(`inscripción: evento ${i.evento} no existe`);
    else if (ev.en_dias <= 0)
      errores.push(`inscripción a evento pasado ${i.evento}`);
    if (!jovenes.has(i.joven))
      errores.push(`inscripción: joven ${i.joven} no existe`);
    const k = `${i.joven}|${i.evento}`;
    if (insc.has(k)) errores.push(`inscripción repetida ${k}`);
    insc.add(k);
  }
  const resen = new Set();
  for (const r of c.resenias) {
    if (!empresas.has(r.empresa))
      errores.push(`reseña: empresa ${r.empresa} no existe`);
    if (!jovenes.has(r.joven))
      errores.push(`reseña: joven ${r.joven} no existe`);
    const k = `${r.joven}|${r.empresa}`;
    if (resen.has(k)) errores.push(`reseña repetida ${k}`);
    resen.add(k);
    if (!(r.calificacion >= 1 && r.calificacion <= 5))
      errores.push(`reseña ${k}: calificación fuera de 1 a 5`);
  }

  if (errores.length) {
    for (const e of errores) console.error(`  · ${e}`);
    fallar(`${errores.length} problemas en contenido.json`);
  }
  console.log(
    `✓ contenido válido: ${c.empresas.length} empresas, ${c.jovenes.length} jóvenes, ` +
      `${c.vacantes.length} búsquedas, ${c.postulaciones.length} postulaciones, ` +
      `${c.eventos.length} eventos, ${c.inscripciones.length} inscripciones, ` +
      `${c.resenias.length} reseñas`,
  );
}

// ── conteo y borrado ───────────────────────────────────────────────────────

async function contar() {
  const n = async (tabla) => {
    const { count, error } = await db
      .from(tabla)
      .select("*", { count: "exact", head: true });
    if (error) fallar(`${tabla}: ${error.message}`);
    return count;
  };
  let usuarios = 0;
  for (let pagina = 1; ; pagina++) {
    const { data } = await db.auth.admin.listUsers({
      page: pagina,
      perPage: 1000,
    });
    usuarios += data.users.length;
    if (data.users.length < 1000) break;
  }
  const filas = {
    "usuarios (auth.users)": usuarios,
    empresas: await n("empresas"),
    "perfiles de jóvenes": await n("perfiles"),
    "búsquedas (vacantes)": await n("vacantes"),
    postulaciones: await n("postulaciones"),
    eventos: await n("eventos"),
    inscripciones: await n("inscripciones_evento"),
    reseñas: await n("resenias"),
    avisos: await n("notificaciones"),
  };
  for (const [k, v] of Object.entries(filas))
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  return filas;
}

/**
 * Con la confirmación de correo activada en GoTrue, una cuenta sin
 * `email_confirmed_at` no puede iniciar sesión. Las de la demo se crean
 * confirmadas (`email_confirm: true`); esto lo comprueba en vez de suponerlo.
 */
async function verificarCorreosConfirmados() {
  const sinConfirmar = [];
  let total = 0;
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({
      page: pagina,
      perPage: 1000,
    });
    if (error) fallar(`listar usuarios: ${error.message}`);
    total += data.users.length;
    for (const u of data.users)
      if (!u.email_confirmed_at) sinConfirmar.push(u.email);
    if (data.users.length < 1000) break;
  }
  if (sinConfirmar.length)
    fallar(`cuentas sin correo confirmado: ${sinConfirmar.join(", ")}`);
  console.log(`✓ las ${total} cuentas tienen el correo confirmado`);
}

async function vaciarBucket() {
  const carpetas = await exigir(
    db.storage.from(BUCKET).list("", { limit: 1000 }),
    "listar bucket",
  );
  let borrados = 0;
  for (const carpeta of carpetas) {
    const archivos = await exigir(
      db.storage.from(BUCKET).list(carpeta.name, { limit: 1000 }),
      `listar ${carpeta.name}`,
    );
    const caminos = archivos.map((a) => `${carpeta.name}/${a.name}`);
    if (carpeta.id) caminos.push(carpeta.name); // archivo suelto en la raíz
    if (caminos.length) {
      await exigir(db.storage.from(BUCKET).remove(caminos), "borrar imágenes");
      borrados += caminos.length;
    }
  }
  return borrados;
}

async function borrarTodo() {
  let borrados = 0;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) fallar(`listar usuarios: ${error.message}`);
    if (!data.users.length) break;
    for (const u of data.users) {
      const { error: e } = await db.auth.admin.deleteUser(u.id);
      if (e) fallar(`borrar ${u.id}: ${e.message}`);
      borrados++;
    }
  }
  const imagenes = await vaciarBucket();
  console.log(`✓ borradas ${borrados} cuentas y ${imagenes} imágenes`);
}

// ── carga ──────────────────────────────────────────────────────────────────

function leerCredenciales() {
  const previas = {};
  if (existsSync(CREDENCIALES)) {
    for (const linea of readFileSync(CREDENCIALES, "utf8").split("\n")) {
      const m = linea.match(/^(CLAVE_[A-Z_]+)=(.+)$/);
      if (m) previas[m[1]] = m[2];
    }
  }
  return {
    joven: previas.CLAVE_JOVEN_DEMO ?? clave(),
    empresa: previas.CLAVE_EMPRESA_DEMO ?? clave(),
    comun: previas.CLAVE_COMUN ?? clave(),
  };
}

async function crearUsuario(email, password) {
  const data = await exigir(
    db.auth.admin.createUser({ email, password, email_confirm: true }),
    `crear ${email}`,
  );
  return data.user.id;
}

async function cargar(cat) {
  const c = contenido;
  const claves = leerCredenciales();
  const ids = { empresas: {}, jovenes: {}, vacantes: {}, eventos: {} };
  const correo = (x, tipo) =>
    x.demo && args.get(`correo-demo-${tipo}`)
      ? args.get(`correo-demo-${tipo}`)
      : x.email;
  const clavePara = (x, tipo) => (x.demo ? claves[tipo] : claves.comun);

  for (const e of c.empresas) {
    const id = await crearUsuario(
      correo(e, "empresa"),
      clavePara(e, "empresa"),
    );
    ids.empresas[e.clave] = id;
    await exigir(
      db.from("cuentas").insert({ id, tipo: "empresa" }),
      `cuenta ${e.clave}`,
    );
    const logo_url = await subirImagen(id, "logo", await logoDe(e.clave));
    await exigir(
      db.from("empresas").insert({
        id,
        razon_social: e.razon_social,
        rut: e.rut,
        rubro: e.rubro,
        descripcion: e.descripcion,
        sitio_web: e.sitio_web,
        logo_url,
        creada_en: diasAtras(60 + Math.floor(Math.random() * 60)),
      }),
      `empresa ${e.clave}`,
    );
  }
  console.log(`✓ ${c.empresas.length} empresas con su logo`);

  for (const j of c.jovenes) {
    const id = await crearUsuario(correo(j, "joven"), clavePara(j, "joven"));
    ids.jovenes[j.clave] = id;
    await exigir(
      db.from("cuentas").insert({ id, tipo: "individual" }),
      `cuenta ${j.clave}`,
    );
    await exigir(
      db.from("perfiles").insert({
        id,
        nombre_usuario: j.nombre_usuario,
        nombre: j.nombre,
        apellido: j.apellido,
        fecha_nacimiento: j.fecha_nacimiento,
        pais: j.pais,
        bio: j.bio,
        creado_en: diasAtras(20 + Math.floor(Math.random() * 60)),
      }),
      `perfil ${j.clave}`,
    );
    await exigir(
      db
        .from("perfil_tags")
        .insert(
          j.tags.map((t) => ({ perfil_id: id, tag_id: cat.tags.get(t) })),
        ),
      `tags ${j.clave}`,
    );
    await exigir(
      db.from("perfil_habilidades").insert(
        j.habilidades.map((h) => ({
          perfil_id: id,
          habilidad_id: cat.habilidades.get(h),
        })),
      ),
      `habilidades ${j.clave}`,
    );
    await exigir(
      db
        .from("formaciones")
        .insert(j.formaciones.map((f) => ({ perfil_id: id, ...f }))),
      `formaciones ${j.clave}`,
    );
    if (j.personalidad) {
      await exigir(
        db.from("perfil_personalidad").insert({
          perfil_id: id,
          tipo: j.personalidad.tipo,
          visible_para_empresas: j.personalidad.visible,
        }),
        `personalidad ${j.clave}`,
      );
    }
    if (j.tests?.length) {
      await exigir(
        db.from("resultados_de_tests").insert(
          j.tests.map((t) => ({
            perfil_id: id,
            test: t.test,
            puntaje: t.puntaje ?? null,
            resultado: t.resultado ?? null,
            visible_para_empresas: t.visible,
          })),
        ),
        `tests ${j.clave}`,
      );
    }
  }
  console.log(
    `✓ ${c.jovenes.length} jóvenes con intereses, habilidades y formación ` +
      `(${c.jovenes.filter((j) => j.personalidad?.visible).length} con la personalidad compartida, ` +
      `${c.jovenes.filter((j) => j.personalidad && !j.personalidad.visible).length} con la personalidad oculta, ` +
      `${c.jovenes.flatMap((j) => j.tests ?? []).length} resultados de tests opcionales)`,
  );

  for (const [i, v] of c.vacantes.entries()) {
    const fila = await exigir(
      db
        .from("vacantes")
        .insert({
          empresa_id: ids.empresas[v.empresa],
          titulo: v.titulo,
          descripcion: v.descripcion,
          tipo: v.tipo,
          modalidad: v.modalidad,
          ubicacion: v.ubicacion,
          posiciones: v.posiciones,
          estado: "activa",
          creada_en: diasAtras(2 + ((i * 3) % 35), i),
        })
        .select("id")
        .single(),
      `búsqueda ${v.clave}`,
    );
    ids.vacantes[v.clave] = fila.id;
    const enlazar = (tabla, nombres, mapa, campo) =>
      nombres?.length
        ? exigir(
            db.from(tabla).insert(
              nombres.map((n) => ({
                vacante_id: fila.id,
                [campo]: mapa.get(n),
              })),
            ),
            `${tabla} ${v.clave}`,
          )
        : null;
    await enlazar(
      "vacante_habilidades",
      v.habilidades,
      cat.habilidades,
      "habilidad_id",
    );
    await enlazar("vacante_tags_publicos", v.tags, cat.tags, "tag_id");
    await enlazar("vacante_tags_ocultos", v.tagsOcultos, cat.tags, "tag_id");
  }
  console.log(`✓ ${c.vacantes.length} búsquedas`);

  // Las postulaciones entran «pendiente» y avanzan por el camino de la
  // aplicación, de a un estado: así los disparadores escriben los avisos.
  const CAMINO = {
    pendiente: [],
    en_revision: ["en_revision"],
    entrevista: ["en_revision", "entrevista"],
    aceptada: ["en_revision", "entrevista", "aceptada"],
    rechazada: ["en_revision", "rechazada"],
    cancelada: ["cancelada"],
  };
  for (const [i, p] of c.postulaciones.entries()) {
    const fila = await exigir(
      db
        .from("postulaciones")
        .insert({
          vacante_id: ids.vacantes[p.vacante],
          perfil_id: ids.jovenes[p.joven],
          creada_en: diasAtras(1 + (i % 20), i % 24),
        })
        .select("id")
        .single(),
      `postulación ${p.joven}→${p.vacante}`,
    );
    for (const estado of CAMINO[p.estado]) {
      await exigir(
        db.from("postulaciones").update({ estado }).eq("id", fila.id),
        `postulación ${p.joven}→${p.vacante} a ${estado}`,
      );
    }
  }
  console.log(`✓ ${c.postulaciones.length} postulaciones, con sus avisos`);

  // El estado final de las búsquedas va después: cerrar una rechaza las
  // pendientes, igual que en la aplicación (RF3.3.3).
  for (const v of c.vacantes.filter((x) => x.estado !== "activa")) {
    await exigir(
      db
        .from("vacantes")
        .update({ estado: v.estado })
        .eq("id", ids.vacantes[v.clave]),
      `estado de ${v.clave}`,
    );
  }

  for (const e of c.eventos) {
    const fila = await exigir(
      db
        .from("eventos")
        .insert({
          empresa_id: ids.empresas[e.empresa],
          titulo: e.titulo,
          descripcion: e.descripcion,
          fecha_hora: fechaMontevideo(e.en_dias, e.hora),
          direccion: e.direccion,
          latitud: e.latitud,
          longitud: e.longitud,
          estado: "activo",
        })
        .select("id")
        .single(),
      `evento ${e.clave}`,
    );
    ids.eventos[e.clave] = fila.id;
    if (e.tags?.length)
      await exigir(
        db.from("evento_tags").insert(
          e.tags.map((t) => ({
            evento_id: fila.id,
            tag_id: cat.tags.get(t),
          })),
        ),
        `tags de ${e.clave}`,
      );
  }
  await exigir(
    db.from("inscripciones_evento").insert(
      c.inscripciones.map((i, n) => ({
        evento_id: ids.eventos[i.evento],
        perfil_id: ids.jovenes[i.joven],
        creada_en: diasAtras(n % 10, n % 24),
      })),
    ),
    "inscripciones",
  );
  // Cancelar después de las inscripciones: el disparador avisa a los inscriptos.
  for (const e of c.eventos.filter((x) => x.estado === "cancelado")) {
    await exigir(
      db
        .from("eventos")
        .update({ estado: "cancelado" })
        .eq("id", ids.eventos[e.clave]),
      `cancelar ${e.clave}`,
    );
  }
  console.log(
    `✓ ${c.eventos.length} eventos y ${c.inscripciones.length} inscripciones`,
  );

  await exigir(
    db.from("resenias").insert(
      c.resenias.map((r, n) => ({
        empresa_id: ids.empresas[r.empresa],
        perfil_id: ids.jovenes[r.joven],
        calificacion: r.calificacion,
        comentario: r.comentario,
        creada_en: diasAtras(3 + n * 2),
      })),
    ),
    "reseñas",
  );
  console.log(`✓ ${c.resenias.length} reseñas`);

  // Los disparadores encolaron un correo por cada postulación y cada
  // selección o descarte de la carga (migración 007). Son historia armada,
  // no novedades: se cierran sin mandarse, así una recarga no le escribe 40
  // correos a las cuentas demo, que tienen dirección real.
  const cerrados = await exigir(
    db
      .from("correos_pendientes")
      .update({
        enviado_en: new Date().toISOString(),
        ultimo_error: "omitido: carga de la demo",
      })
      .is("enviado_en", null)
      .select("id"),
    "correos de la carga",
  );
  console.log(`✓ ${cerrados.length} correos de la carga cerrados sin mandar`);

  const jovenDemo = c.jovenes.find((j) => j.demo);
  const empresaDemo = c.empresas.find((e) => e.demo);
  writeFileSync(
    CREDENCIALES,
    [
      "# LinkYouth — cuentas de la demo. NO va al repositorio.",
      `# Generado por scripts/demo/sembrar.mjs el ${new Date().toISOString()}`,
      "",
      "## Joven",
      `CORREO_JOVEN_DEMO=${correo(jovenDemo, "joven")}`,
      `USUARIO_JOVEN_DEMO=${jovenDemo.nombre_usuario}`,
      `CLAVE_JOVEN_DEMO=${claves.joven}`,
      "",
      "## Empresa",
      `CORREO_EMPRESA_DEMO=${correo(empresaDemo, "empresa")}`,
      `RAZON_SOCIAL_DEMO=${empresaDemo.razon_social}`,
      `CLAVE_EMPRESA_DEMO=${claves.empresa}`,
      "",
      "## Resto de las cuentas (correos en scripts/demo/contenido.json)",
      `CLAVE_COMUN=${claves.comun}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  chmodSync(CREDENCIALES, 0o600);
  console.log(`✓ credenciales en ${CREDENCIALES} (600)`);
  return ids;
}

// ── principal ──────────────────────────────────────────────────────────────

const cat = await catalogos();
validar(cat);

if (args.has("validar")) process.exit(0);

if (args.has("contar")) {
  await contar();
  await verificarCorreosConfirmados();
  process.exit(0);
}

if (!args.has("borrar-todo") || !args.has("confirmo")) {
  fallar("Para borrar y cargar hacen falta --borrar-todo y --confirmo.");
}

console.log("Hoy hay en la base:");
await contar();
await borrarTodo();
const ids = await cargar(cat);
// Las fotos de Unsplash que ya se eligieron (scripts/fotos/fotos.json): así
// la recarga nunca deja a nadie sin imagen y no consulta la API.
const fotos = await cargarFotos(db, contenido, ids);
console.log(
  `✓ ${fotos.fotos} fotos de Unsplash: ${fotos.fijos} lugares de la página, ${fotos.personas} jóvenes, ${fotos.empresas} portadas de empresa, ${fotos.eventos} eventos`,
);
console.log("Quedó en la base:");
await contar();
await verificarCorreosConfirmados();
