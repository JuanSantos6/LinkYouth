#!/usr/bin/env node
/**
 * Paso 1 de 4: una búsqueda en Unsplash por categoría y su hoja de contactos.
 *
 *   node scripts/fotos/buscar.mjs
 *
 * Por cada categoría de `categorias.json` (retratos, trabajo, instituciones,
 * eventos, portada) hace **una** consulta de 30 resultados
 * (`content_filter=high`): cinco consultas en total, en una sola corrida y
 * sin esperas. Arma una hoja numerada por categoría en
 * ~/.cache/linkyouth-fotos/hojas/<categoria>.webp para elegir mirándolas. Las
 * hojas son para revisar: no van al repositorio ni a la página, que muestra
 * cada foto por hotlink.
 *
 * Las respuestas quedan guardadas: volver a correrlo no gasta consultas.
 *
 * Después: anotar en `elegidas.json` el número de cada lugar y su texto
 * alternativo, y seguir con `registrar.mjs`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { bajarMiniatura, pedir, TRABAJO } from "./unsplash.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const { categorias } = JSON.parse(
  readFileSync(join(AQUI, "categorias.json"), "utf8"),
);

const BUSQUEDAS = join(TRABAJO, "busquedas");
const HOJAS = join(TRABAJO, "hojas");
mkdirSync(BUSQUEDAS, { recursive: true });
mkdirSync(HOJAS, { recursive: true });

const LADO = 260;
const COLUMNAS = 6;

async function hoja(nombre, resultados) {
  const filas = Math.ceil(resultados.length / COLUMNAS);
  const piezas = await Promise.all(
    resultados.map(async (foto, i) => {
      const imagen = await sharp(await bajarMiniatura(foto.urls.small))
        .resize(LADO, LADO, { fit: "cover", position: "attention" })
        .toBuffer();
      const rotulo = Buffer.from(
        `<svg width="${LADO}" height="${LADO}"><rect x="6" y="6" width="44" height="30" rx="6" fill="#15132A" opacity=".85"/><text x="28" y="28" font-family="sans-serif" font-size="20" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text></svg>`,
      );
      return {
        input: await sharp(imagen)
          .composite([{ input: rotulo }])
          .toBuffer(),
        left: (i % COLUMNAS) * (LADO + 6),
        top: Math.floor(i / COLUMNAS) * (LADO + 6),
      };
    }),
  );
  await sharp({
    create: {
      width: COLUMNAS * (LADO + 6),
      height: filas * (LADO + 6),
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(piezas)
    .webp({ quality: 80 })
    .toFile(join(HOJAS, `${nombre}.webp`));
}

let gastadas = 0;
let quedan = null;
for (const categoria of categorias) {
  const archivo = join(BUSQUEDAS, `${categoria.categoria}.json`);
  if (!existsSync(archivo)) {
    const parametros = new URLSearchParams({
      query: categoria.consulta,
      per_page: "30",
      orientation: categoria.orientacion,
      content_filter: "high",
    });
    const respuesta = await pedir(`/search/photos?${parametros}`);
    writeFileSync(archivo, JSON.stringify(respuesta.datos.results, null, 2));
    gastadas++;
    quedan = respuesta.quedan;
  }
  const resultados = JSON.parse(readFileSync(archivo, "utf8"));
  if (resultados.length < categoria.lugares.length) {
    throw new Error(
      `«${categoria.categoria}» trajo ${resultados.length} fotos y necesita ${categoria.lugares.length}`,
    );
  }
  await hoja(categoria.categoria, resultados);
  console.log(
    `✓ ${categoria.categoria}: ${resultados.length} candidatas para ${categoria.lugares.length} lugares`,
  );
}

console.log(
  `\nHojas en ${HOJAS}. Consultas nuevas: ${gastadas}${quedan === null ? "" : ` (quedan ${quedan} en esta hora)`}.`,
);
