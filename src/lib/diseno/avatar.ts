/**
 * El color del avatar automático: para una cuenta sin foto ni logo, las
 * iniciales sobre un color de la paleta Recreo, siempre el mismo para la
 * misma cuenta (2026-10-20).
 *
 * Se elige con un hash del id de la cuenta y no del nombre: si la persona
 * cambia de nombre o la empresa de razón social, su color no cambia, y dos
 * personas que se llaman igual no se confunden. Sin id (contenido de
 * ejemplo), se usa el nombre.
 *
 * Son pares de tokens, no colores escritos a mano: cada par cumple AA en los
 * dos temas porque los tokens ya están medidos (`tokens.ts`). La mandarina no
 * entra: es solo del botón principal. La alerta tampoco: un avatar rojo se lee
 * como un error.
 *
 * Las clases van escritas enteras para que Tailwind las encuentre.
 */
export const COLORES_DE_AVATAR = [
  { fondo: "bg-lavanda", texto: "text-acento" },
  { fondo: "bg-coincide-fondo", texto: "text-sobre-turquesa" },
  { fondo: "bg-acento", texto: "text-sobre-acento" },
  { fondo: "bg-turquesa-texto", texto: "text-sobre-violeta" },
  { fondo: "bg-tinta", texto: "text-papel" },
] as const;

export type ColorDeAvatar = (typeof COLORES_DE_AVATAR)[number];

/** FNV-1a de 32 bits: corto, estable entre servidor y navegador, sin dependencias. */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function colorDeAvatar(semilla: string): ColorDeAvatar {
  return COLORES_DE_AVATAR[hash(semilla) % COLORES_DE_AVATAR.length];
}
