// Convierte las fotos elegidas (scripts/imagenes/manifiesto.json) a WebP,
// en los tamaños que usa la página. Ver docs/imagenes.md.
//
//   node scripts/imagenes/preparar.mjs <carpeta con los originales>
//
// Los originales (JPG de Pexels o Unsplash) no van al repositorio: se
// descargan de la página de cada foto, que está en el manifiesto. Lo que va
// al repositorio es la salida:
//
// - `portada-*` y `rubro-*` → `public/imagenes/<espacio>-{640,1280}.webp`,
//   16:9, que sirve la propia aplicación. Son el respaldo de cada lugar: desde
//   el 2026-10-22 la primera opción es la foto de Unsplash por hotlink, y las
//   personas y eventos de la demo salen de ahí (`scripts/fotos/`).
//
// Además escribe `src/lib/imagenes.generado.ts` con la ruta, el tamaño y el
// texto alternativo de cada imagen de la página.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../..");
const origen = process.argv[2];
if (!origen) {
  console.error("Uso: node scripts/imagenes/preparar.mjs <carpeta>");
  process.exit(1);
}

const manifiesto = JSON.parse(
  readFileSync(join(RAIZ, "scripts/imagenes/manifiesto.json"), "utf8"),
);
const POSICION = { centro: "attention", arriba: "north", abajo: "south" };

const PUBLICO = join(RAIZ, "public/imagenes");
mkdirSync(PUBLICO, { recursive: true });

const deLaPagina = {};
/**
 * Con `centroY` (0 a 1) en el manifiesto, el recorte horizontal se centra a
 * esa altura de la foto en vez de dejarlo a `foco`: sirve para fotos
 * verticales donde lo importante no está ni arriba ni al medio.
 */
async function abrir(foto, proporcion) {
  const entrada = sharp(join(origen, foto.archivo)).rotate();
  if (foto.centroY === undefined) return entrada;
  const { width, height } = await entrada.metadata();
  const alto = Math.min(height, Math.round(width / proporcion));
  const top = Math.max(
    0,
    Math.min(height - alto, Math.round(foto.centroY * height - alto / 2)),
  );
  return sharp(
    await entrada.extract({ left: 0, top, width, height: alto }).toBuffer(),
  );
}

for (const [espacio, foto] of Object.entries(manifiesto)) {
  const entrada = await abrir(foto, 16 / 9);
  const position = POSICION[foto.foco] ?? "attention";
  const webp = (s) => s.webp({ quality: 74, effort: 6 });

  if (espacio.startsWith("portada-") || espacio.startsWith("rubro-")) {
    for (const ancho of [640, 1280]) {
      await webp(
        entrada.clone().resize(ancho, Math.round((ancho * 9) / 16), {
          fit: "cover",
          position,
        }),
      ).toFile(join(PUBLICO, `${espacio}-${ancho}.webp`));
    }
    deLaPagina[espacio] = {
      src: `/imagenes/${espacio}-1280.webp`,
      srcSet: `/imagenes/${espacio}-640.webp 640w, /imagenes/${espacio}-1280.webp 1280w`,
      ancho: 1280,
      alto: 720,
      alt: foto.alt,
    };
  } else {
    console.warn(`· ${espacio}: espacio desconocido, se saltea`);
    continue;
  }
  console.log(`✓ ${espacio}`);
}

const claves = Object.keys(deLaPagina).sort();
writeFileSync(
  join(RAIZ, "src/lib/imagenes.generado.ts"),
  `// Generado por scripts/imagenes/preparar.mjs a partir de
// scripts/imagenes/manifiesto.json. No editar a mano: cambiar el manifiesto
// y volver a correr el script. Fuentes y licencias en docs/imagenes.md.

export const IMAGENES = ${JSON.stringify(
    Object.fromEntries(claves.map((c) => [c, deLaPagina[c]])),
    null,
    2,
  )} as const;

export type EspacioDeImagen = keyof typeof IMAGENES;
`,
);
console.log(`✓ src/lib/imagenes.generado.ts (${claves.length} imágenes)`);
