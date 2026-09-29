/**
 * Tokens de diseño de LinkYouth — sistema «Recreo».
 *
 * Única fuente de verdad del color. `src/app/globals.css` declara estos mismos
 * valores como variables CSS; este archivo los deja escritos para que el
 * código (el guion de tema, la documentación, los tests de contraste) no
 * tenga que adivinarlos.
 *
 * La paleta nace del logo oficial (versión 3): su violeta es el color de
 * marca y su turquesa marca «esto ya lo tenés». La mandarina es el acento
 * cálido del botón principal y de nada más. Los neutros son la base: ocupan
 * casi toda la pantalla, y los acentos aparecen donde significan algo.
 *
 * Hay una sola paleta. El selector de cinco colores de Ajustes se sacó: un
 * color de marca que cambia según quién mira deja de ser la marca.
 *
 * Todos los pares de texto están medidos con la fórmula de WCAG 2.1. El detalle
 * está en `docs/decisiones.md` (2026-09-27) y en la skill `diseno-linkyouth`.
 */

type Paleta = Record<string, string>;

/** Tema claro. */
export const CLARO: Paleta = {
  tinta: "#1E1A38", // texto — 15,5:1 sobre papel
  papel: "#F7F6FB", // fondo de página
  superficie: "#FFFFFF", // tarjetas
  realce: "#F0EEF7", // bloque dentro de una tarjeta, campo deshabilitado
  apagado: "#5B5770", // texto secundario — 6,4:1 sobre papel
  borde: "#E4E1EE", // borde de tarjeta, decorativo
  bordeControl: "#8A86A0", // borde de campo o botón — 3,3:1 (WCAG 1.4.11)
  filete: "#ECEAF3", // separador entre filas

  violeta: "#8C66FA", // marca, del logo — solo como forma (3,9:1 contra blanco)
  violetaTexto: "#6541E0", // enlaces, foco, texto de acento — 6,2:1
  lavanda: "#EFEAFF", // fondo suave: fecha de evento, invitación

  turquesa: "#19DDD2", // «ya lo tenés», del logo — solo de relleno, con tinta encima (9,8:1)
  turquesaTexto: "#0A7A73", // borde e ícono de lo que ya tenés — 5,2:1
  coincideFondo: "#C8F5F2", // etiqueta que coincide, en claro — tinta encima 14:1

  mandarina: "#F25C1A", // solo el botón principal — tinta encima 5,0:1
  alerta: "#B8123F", // errores, siempre con la palabra — 6,6:1
};

/** Tema oscuro: los mismos roles con otros valores. */
export const OSCURO: Paleta = {
  tinta: "#F3F1FA",
  papel: "#15132A",
  superficie: "#1F1C38",
  realce: "#27233F",
  apagado: "#B4B0C9",
  borde: "#34304F",
  bordeControl: "#817C9C",
  filete: "#2A2645",

  violeta: "#9D7BFF",
  violetaTexto: "#B39DFF",
  lavanda: "#2C2752",

  turquesa: "#19DDD2",
  turquesaTexto: "#19DDD2",
  coincideFondo: "#19DDD2",

  mandarina: "#FF8A4C",
  alerta: "#FF7A99",
};

/**
 * Preferencia de tema. «sistema» no escribe nada en el elemento raíz: el CSS
 * sigue a `prefers-color-scheme`. «claro» y «oscuro» fuerzan el valor.
 */
export const TEMAS = ["sistema", "claro", "oscuro"] as const;
export type Tema = (typeof TEMAS)[number];

export const TEMA_POR_DEFECTO: Tema = "sistema";

export const CLAVE_TEMA = "linkyouth.tema";

export function esTema(valor: unknown): valor is Tema {
  return TEMAS.includes(valor as Tema);
}

/** El orden en que el botón del encabezado recorre las opciones. */
export function temaSiguiente(tema: Tema): Tema {
  const orden: Record<Tema, Tema> = {
    sistema: "claro",
    claro: "oscuro",
    oscuro: "sistema",
  };
  return orden[tema];
}
