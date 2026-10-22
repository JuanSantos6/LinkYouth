#!/usr/bin/env node
/**
 * Paso 2 de 4: registrar las fotos elegidas. No consulta la API.
 *
 *   node scripts/fotos/registrar.mjs
 *
 * Lee `elegidas.json` (por categoría, lugar → número de la hoja y texto
 * alternativo), toma cada foto de la búsqueda guardada por `buscar.mjs` y
 * deja todo en `fotos.json`: la URL para el hotlink, el autor, los enlaces
 * de la atribución, el texto alternativo y la dirección de `download_location`
 * que hay que avisar. Ese archivo va al repositorio y es lo que cargan
 * `cargar.mjs` y la recarga de la demo, sin volver a consultar la API.
 *
 * Los avisos de descarga los hace después, en segundo plano,
 * `avisar-descargas.mjs`; una foto ya avisada conserva su fecha.
 *
 * Una misma foto en dos lugares es un error (dos jóvenes con la misma cara),
 * y también un lugar de `categorias.json` sin elegir. `numero: null` deja un
 * lugar a propósito con su respaldo propio; `de` elige de otra búsqueda ya
 * guardada.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FOTOS = join(AQUI, "fotos.json");
const TRABAJO =
  process.env.FOTOS_TRABAJO ??
  join(process.env.HOME, ".cache", "linkyouth-fotos");

const { categorias } = JSON.parse(
  readFileSync(join(AQUI, "categorias.json"), "utf8"),
);
const { elegidas } = JSON.parse(
  readFileSync(join(AQUI, "elegidas.json"), "utf8"),
);
const previo = existsSync(FOTOS)
  ? JSON.parse(readFileSync(FOTOS, "utf8"))
  : { fotos: [] };
const avisadas = new Map(
  previo.fotos.map((f) => [f.unsplash_id, f.descarga_avisada_en]),
);

const fotos = [];
const lugares = {};
const usadas = new Map();
const errores = [];

for (const categoria of categorias) {
  const resultados = JSON.parse(
    readFileSync(
      join(TRABAJO, "busquedas", `${categoria.categoria}.json`),
      "utf8",
    ),
  );
  const deLaCategoria = elegidas[categoria.categoria] ?? {};
  for (const { lugar } of categoria.lugares) {
    const eleccion = deLaCategoria[lugar];
    if (!eleccion) {
      errores.push(`falta elegir «${lugar}»`);
      continue;
    }
    // `null`: a propósito sin foto de Unsplash; queda el respaldo propio.
    if (eleccion.numero === null) continue;
    // `de`: elegir de otra búsqueda ya guardada (sin consultar de nuevo).
    const foto = (
      eleccion.de
        ? JSON.parse(
            readFileSync(
              join(TRABAJO, "busquedas", `${eleccion.de}.json`),
              "utf8",
            ),
          )
        : resultados
    )[eleccion.numero - 1];
    if (!foto) {
      errores.push(`«${lugar}»: no hay foto ${eleccion.numero}`);
      continue;
    }
    if (!eleccion.alt?.trim()) errores.push(`«${lugar}» sin texto alternativo`);
    if (usadas.has(foto.id)) {
      errores.push(
        `la foto ${eleccion.numero} de ${categoria.categoria} está en «${usadas.get(foto.id)}» y en «${lugar}»`,
      );
    }
    usadas.set(foto.id, lugar);
    lugares[lugar] = foto.id;
    fotos.push({
      url: foto.urls.raw,
      unsplash_id: foto.id,
      autor: foto.user.name,
      autor_enlace: foto.user.links.html,
      enlace: foto.links.html,
      descripcion: eleccion.alt.trim(),
      ancho: foto.width,
      alto: foto.height,
      color: /^#[0-9a-f]{6}$/i.test(foto.color ?? "") ? foto.color : null,
      descarga: foto.links.download_location,
      descarga_avisada_en: avisadas.get(foto.id) ?? null,
    });
  }
}

if (errores.length) {
  console.error(errores.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}

writeFileSync(
  FOTOS,
  JSON.stringify(
    {
      _: "Generado por scripts/fotos/registrar.mjs a partir de elegidas.json. No editar a mano.",
      fotos: fotos.sort((a, b) => a.unsplash_id.localeCompare(b.unsplash_id)),
      lugares,
    },
    null,
    2,
  ) + "\n",
);
const faltan = fotos.filter((f) => !f.descarga_avisada_en).length;
console.log(
  `✓ ${fotos.length} fotos en ${FOTOS}; ${faltan} descargas para avisar con avisar-descargas.mjs.`,
);
