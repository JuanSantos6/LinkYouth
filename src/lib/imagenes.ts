import { type EspacioDeImagen, IMAGENES } from "./imagenes.generado";

/**
 * Las fotos de la página (portada y cabecera de cada búsqueda), servidas
 * desde `public/imagenes/` en WebP. Cada una lleva su texto alternativo. Las
 * genera `scripts/imagenes/preparar.mjs`; fuentes y licencias en
 * `docs/imagenes.md`.
 */
export type ImagenDePagina = (typeof IMAGENES)[EspacioDeImagen];

export function imagen(espacio: EspacioDeImagen): ImagenDePagina {
  return IMAGENES[espacio];
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
export function imagenDeRubro(rubro: string | null | undefined) {
  if (!rubro) return null;
  const texto = sinTildes(rubro);
  const espacio = RUBROS.find(([patron]) => patron.test(texto))?.[1];
  return espacio && espacio in IMAGENES
    ? IMAGENES[espacio as EspacioDeImagen]
    : null;
}
