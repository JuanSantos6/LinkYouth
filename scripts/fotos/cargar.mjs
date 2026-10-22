#!/usr/bin/env node
/**
 * Paso 3 de 3: cargar en la base las fotos de `fotos.json`. No usa la API de
 * Unsplash ni su clave: solo la base, con la clave de servicio.
 *
 *   node scripts/fotos/cargar.mjs
 *
 * - `fotos`: una fila por foto (URL del hotlink y atribución). Las que ya no
 *   están en el archivo se borran.
 * - `lugares_con_foto`: los lugares fijos (`portada:`, `vacio:`, `rubro:`,
 *   `institucion:`). Los que ya no están en el archivo se borran.
 * - Las cuentas de la demo: `perfiles.foto_url` (`persona:<clave>`),
 *   `empresas.portada_url` (`empresa:<clave>`) y `eventos.imagen_url`
 *   (`evento:<clave>`), buscadas por nombre de usuario, razón social y título
 *   de `scripts/demo/contenido.json`.
 *
 * `scripts/demo/sembrar.mjs` lo llama al final de cada recarga con los ids
 * que acaba de crear, así la demo nunca pierde sus imágenes.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FOTOS = join(AQUI, "fotos.json");
const FIJOS = /^(portada|vacio|rubro|institucion):/;

async function exigir(promesa, que) {
  const { data, error } = await promesa;
  if (error) throw new Error(`${que}: ${error.message}`);
  return data;
}

/** Los ids de las cuentas de la demo que hoy están en la base. */
async function idsDeLaBase(db, contenido) {
  const ids = { jovenes: {}, empresas: {}, eventos: {} };
  const perfiles = await exigir(
    db
      .from("perfiles")
      .select("id, nombre_usuario")
      .in(
        "nombre_usuario",
        contenido.jovenes.map((j) => j.nombre_usuario),
      ),
    "perfiles de la demo",
  );
  for (const j of contenido.jovenes) {
    const p = perfiles.find((f) => f.nombre_usuario === j.nombre_usuario);
    if (p) ids.jovenes[j.clave] = p.id;
  }
  const empresas = await exigir(
    db
      .from("empresas")
      .select("id, razon_social")
      .in(
        "razon_social",
        contenido.empresas.map((e) => e.razon_social),
      ),
    "empresas de la demo",
  );
  for (const e of contenido.empresas) {
    const f = empresas.find((x) => x.razon_social === e.razon_social);
    if (f) ids.empresas[e.clave] = f.id;
  }
  for (const e of contenido.eventos) {
    const empresa = ids.empresas[e.empresa];
    if (!empresa) continue;
    const [evento] = await exigir(
      db
        .from("eventos")
        .select("id")
        .eq("empresa_id", empresa)
        .eq("titulo", e.titulo)
        .limit(1),
      `evento ${e.clave}`,
    );
    if (evento) ids.eventos[e.clave] = evento.id;
  }
  return ids;
}

/**
 * Carga las fotos. `ids` son los de `sembrar.mjs` (clave → id); sin ellos se
 * buscan en la base. Devuelve cuántas cargó de cada cosa.
 */
export async function cargarFotos(db, contenido, ids) {
  if (!existsSync(FOTOS)) {
    return { fotos: 0, fijos: 0, personas: 0, empresas: 0, eventos: 0 };
  }
  const { fotos, lugares } = JSON.parse(readFileSync(FOTOS, "utf8"));
  const urlDe = new Map(fotos.map((f) => [f.unsplash_id, f.url]));
  ids ??= await idsDeLaBase(db, contenido);

  await exigir(
    db.from("fotos").upsert(
      fotos.map((f) => ({
        url: f.url,
        unsplash_id: f.unsplash_id,
        autor: f.autor,
        autor_enlace: f.autor_enlace,
        enlace: f.enlace,
        descripcion: f.descripcion,
        ancho: f.ancho,
        alto: f.alto,
        color: f.color,
        descarga_avisada_en: f.descarga_avisada_en,
      })),
      { onConflict: "url" },
    ),
    "fotos",
  );

  const fijos = Object.entries(lugares)
    .filter(([lugar]) => FIJOS.test(lugar))
    .map(([lugar, id]) => ({ lugar, url: urlDe.get(id) }));
  await exigir(
    db.from("lugares_con_foto").upsert(fijos, { onConflict: "lugar" }),
    "lugares con foto",
  );
  const sobran = (
    await exigir(db.from("lugares_con_foto").select("lugar"), "lugares")
  )
    .map((f) => f.lugar)
    .filter((lugar) => !(lugar in lugares));
  if (sobran.length) {
    await exigir(
      db.from("lugares_con_foto").delete().in("lugar", sobran),
      "lugares que sobran",
    );
  }

  // Las fotos que se dejaron de usar salen también de la lista de créditos.
  const usadas = new Set(fotos.map((f) => f.url));
  const viejas = (await exigir(db.from("fotos").select("url"), "fotos"))
    .map((f) => f.url)
    .filter((url) => !usadas.has(url));
  if (viejas.length) {
    await exigir(db.from("fotos").delete().in("url", viejas), "fotos viejas");
  }

  const cuenta = {
    fotos: fotos.length,
    fijos: fijos.length,
    personas: 0,
    empresas: 0,
    eventos: 0,
  };
  const destinos = [
    ["persona", "jovenes", "perfiles", "foto_url", "personas"],
    ["empresa", "empresas", "empresas", "portada_url", "empresas"],
    ["evento", "eventos", "eventos", "imagen_url", "eventos"],
  ];
  for (const [prefijo, grupo, tabla, columna, total] of destinos) {
    for (const [lugar, unsplashId] of Object.entries(lugares)) {
      if (!lugar.startsWith(`${prefijo}:`)) continue;
      const id = ids[grupo]?.[lugar.slice(prefijo.length + 1)];
      if (!id) continue;
      await exigir(
        db
          .from(tabla)
          .update({ [columna]: urlDe.get(unsplashId) })
          .eq("id", id),
        lugar,
      );
      cuenta[total]++;
    }
  }
  return cuenta;
}

// Solo si se corre directo, no al importarlo desde sembrar.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { createClient } = await import("@supabase/supabase-js");
  const raiz = join(AQUI, "..", "..");
  process.loadEnvFile(join(raiz, ".env.local"));
  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const contenido = JSON.parse(
    readFileSync(join(raiz, "scripts", "demo", "contenido.json"), "utf8"),
  );
  const c = await cargarFotos(db, contenido);
  console.log(
    `✓ ${c.fotos} fotos: ${c.fijos} lugares fijos, ${c.personas} jóvenes, ${c.empresas} portadas de empresa y ${c.eventos} eventos`,
  );
}
