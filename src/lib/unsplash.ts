/**
 * Fotos de Unsplash, como las piden sus directrices de la API
 * (https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines):
 *
 * - Se muestran con la URL que devuelve la API (hotlink, `images.unsplash.com`),
 *   sin descargarlas. El tamaño se pide con los parámetros de imgix que la
 *   misma URL acepta (`w`, `q`, `fm`, `fit`, `crop`).
 * - Se atribuyen al fotógrafo y a Unsplash, con enlace a los dos y los
 *   parámetros `utm_source` y `utm_medium=referral`.
 * - Al usar una foto se avisa a su `download_location`. Eso lo hace el script
 *   que las elige (`scripts/fotos/`), una sola vez, no cada visita.
 *
 * Este módulo no habla con la API ni con la base: arma URLs a partir de lo
 * que guardó el script en `fotos`. Lo usan el servidor y el navegador.
 */

export const ORIGEN_DE_UNSPLASH = "https://images.unsplash.com";

/** Nombre de la aplicación en los enlaces de atribución. */
const APLICACION = "linkyouth";

/** Lo que hace falta para mostrar una foto con su crédito. */
export type CreditoDeFoto = {
  autor: string;
  /** Perfil del fotógrafo, ya con los parámetros de referencia. */
  autorEnlace: string;
  /** Página de Unsplash, ya con los parámetros de referencia. */
  unsplashEnlace: string;
};

export type FilaDeFoto = {
  url: string;
  autor: string;
  autor_enlace: string;
  enlace: string;
  descripcion: string;
  ancho: number;
  alto: number;
  color: string | null;
};

export function esDeUnsplash(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(`${ORIGEN_DE_UNSPLASH}/`);
}

/**
 * La URL de una foto en un tamaño. `encuadre: "caras"` recorta centrando las
 * caras (avatares); `"entropia"`, el resto.
 */
export function urlConTamanio(
  url: string,
  ancho: number,
  {
    alto,
    encuadre = "entropia",
  }: { alto?: number; encuadre?: "caras" | "entropia" } = {},
): string {
  const destino = new URL(url);
  destino.searchParams.set("w", String(ancho));
  if (alto) destino.searchParams.set("h", String(alto));
  destino.searchParams.set("fit", "crop");
  destino.searchParams.set("crop", encuadre === "caras" ? "faces" : "entropy");
  destino.searchParams.set("fm", "webp");
  destino.searchParams.set("q", "75");
  return destino.toString();
}

/** Un enlace a unsplash.com con los parámetros de referencia que piden. */
export function conReferencia(enlace: string): string {
  const destino = new URL(enlace);
  destino.searchParams.set("utm_source", APLICACION);
  destino.searchParams.set("utm_medium", "referral");
  return destino.toString();
}

export function creditoDe(
  fila: Pick<FilaDeFoto, "autor" | "autor_enlace">,
): CreditoDeFoto {
  return {
    autor: fila.autor,
    autorEnlace: conReferencia(fila.autor_enlace),
    unsplashEnlace: conReferencia("https://unsplash.com/"),
  };
}

/**
 * Una fila de `fotos` como imagen de página: 1280 px de ancho, con 640 y 1920
 * en el `srcSet`, y su crédito. El alto sale de la proporción del original.
 */
export function imagenDeUnsplash(
  fila: FilaDeFoto,
  { encuadre }: { encuadre?: "caras" | "entropia" } = {},
): {
  src: string;
  srcSet: string;
  ancho: number;
  alto: number;
  alt: string;
  color: string | null;
  credito: CreditoDeFoto;
} {
  const ancho = 1280;
  const alto = Math.round((fila.alto / fila.ancho) * ancho);
  const tamanio = (w: number) => urlConTamanio(fila.url, w, { encuadre });
  return {
    src: tamanio(ancho),
    srcSet: [640, 1280, 1920].map((w) => `${tamanio(w)} ${w}w`).join(", "),
    ancho,
    alto,
    alt: fila.descripcion,
    color: fila.color,
    credito: creditoDe(fila),
  };
}
