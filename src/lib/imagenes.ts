import { type EspacioDeImagen, IMAGENES } from "./imagenes.generado";
import type { CreditoDeFoto } from "./unsplash";

/**
 * Una foto de la página, con sus tamaños y su texto alternativo.
 *
 * Desde el 2026-10-22 la primera opción de cada lugar es una foto de Unsplash
 * por hotlink, con su `credito` (`src/lib/data/fotos.ts`). Si el lugar todavía
 * no tiene una, queda la foto propia de `public/imagenes/` que genera
 * `scripts/imagenes/preparar.mjs`. Fuentes y licencias en `docs/imagenes.md`.
 */
export type ImagenDePagina = {
  src: string;
  srcSet?: string;
  ancho: number;
  alto: number;
  alt: string;
  /** Color de fondo mientras carga. */
  color?: string | null;
  /** Atribución, obligatoria para las de Unsplash. */
  credito?: CreditoDeFoto;
};

export function imagen(espacio: EspacioDeImagen): ImagenDePagina {
  return IMAGENES[espacio];
}

/**
 * El lugar de la foto de un rubro (`rubro:tecnologia`), o `null`. Es la clave
 * en `lugares_con_foto`; sin foto de Unsplash, `imagenDeRubro` da la propia.
 */
export function lugarDeRubro(rubro: string | null | undefined): string | null {
  if (!rubro) return null;
  const texto = sinTildes(rubro);
  const espacio = RUBROS.find(([patron]) => patron.test(texto))?.[1];
  return espacio ? espacio.replace("rubro-", "rubro:") : null;
}

/** Qué palabras del rubro llevan a cada foto. El rubro es texto libre. */
const RUBROS: readonly [RegExp, string][] = [
  [/tecnolog|software|inform/, "rubro-tecnologia"],
  [/gastronom|cafe|restaur|cocina/, "rubro-gastronomia"],
  [/logistic|transporte|distribuc/, "rubro-logistica"],
  [/salud|clinica|medic/, "rubro-salud"],
  [/comercio|venta|retail|tienda/, "rubro-comercio"],
  [/hotel|turism/, "rubro-hoteleria-turismo"],
  [/construcc|arquitect|obra/, "rubro-construccion"],
  [/agro|campo|rural|sustentab/, "rubro-agro"],
];

const sinTildes = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * La foto de cabecera para el rubro de una empresa, o `null` si el rubro no
 * tiene una: en ese caso la búsqueda se muestra sin foto, no con una de otro
 * rubro.
 */
export function imagenDeRubro(
  rubro: string | null | undefined,
): ImagenDePagina | null {
  if (!rubro) return null;
  const texto = sinTildes(rubro);
  const espacio = RUBROS.find(([patron]) => patron.test(texto))?.[1];
  return espacio && espacio in IMAGENES
    ? IMAGENES[espacio as EspacioDeImagen]
    : null;
}
