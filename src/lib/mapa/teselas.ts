/**
 * El servidor de teselas del mapa y lo que hay que mostrar con él.
 *
 * Vive en un solo lugar porque lo leen dos lados que tienen que coincidir: el
 * mapa (`src/components/mapa/`) pide las teselas a esta dirección, y la CSP
 * (`src/lib/seguridad/csp.ts`) deja pasar imágenes solo de este origen. Si se
 * cambia de proveedor, se cambia acá y los dos siguen de acuerdo.
 *
 * Teselas estándar de OpenStreetMap. Su política de uso pide la atribución
 * visible, un Referer válido y no descargarlas en masa: el mapa carga solo lo
 * que se ve. Ver `docs/decisiones.md`, 2026-10-20.
 */
export const ORIGEN_DE_TESELAS = "https://tile.openstreetmap.org";

export const URL_DE_TESELAS = `${ORIGEN_DE_TESELAS}/{z}/{x}/{y}.png`;

/** Obligatoria por la licencia ODbL de los datos de OpenStreetMap. */
export const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">colaboradores de OpenStreetMap</a>';

export const ZOOM_MAXIMO = 19;

/** Montevideo: dónde arranca el mapa cuando todavía no hay ningún punto. */
export const CENTRO_POR_DEFECTO = { latitud: -34.9011, longitud: -56.1645 };
export const ZOOM_POR_DEFECTO = 12;

/** Zoom para un solo punto: se ven la cuadra y las calles de alrededor. */
export const ZOOM_DE_UN_PUNTO = 16;
