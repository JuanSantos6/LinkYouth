/**
 * Tokens de diseño de LinkYouth.
 *
 * Única fuente de verdad del color. De acá salen las variables CSS que emite
 * `src/app/layout.tsx` y las opciones que ofrece la pantalla de Ajustes: si el
 * selector y la hoja de estilos sacaran sus valores de lugares distintos,
 * tarde o temprano dirían cosas distintas.
 *
 * La dirección es «ficha técnica»: un registro que se acredita, no un feed que
 * se scrollea. Cinco valores base y nada más; todo lo demás —superficies,
 * filetes, bordes— se deriva de ellos con `color-mix` en `globals.css`, para
 * que la paleta no se vaya llenando de grises inventados.
 */

/** Los cinco valores base, en su versión clara. */
export const BASE = {
  /** Texto y fondos oscuros. */
  tinta: "#14231D",
  /** Fondo de página. */
  papel: "#EDF0EB",
  /** Texto secundario. */
  apagado: "#5C6B63",
  /**
   * Ámbar. La única audacia del diseño: aparece solo donde algo está
   * acreditado o validado. Si decora, deja de significar, así que no cambia
   * con el acento ni con el tema.
   */
  senal: "#FFB627",
} as const;

export const TEMAS = ["claro", "oscuro"] as const;
export type Tema = (typeof TEMAS)[number];

export const NOMBRES_DE_ACENTO = [
  "pino",
  "marino",
  "ciruela",
  "ladrillo",
  "grafito",
] as const;
export type NombreDeAcento = (typeof NOMBRES_DE_ACENTO)[number];

export type Acento = {
  etiqueta: string;
  /** Relleno en tema claro. Lleva texto claro encima. */
  claro: string;
  /**
   * Relleno en tema oscuro. Es el mismo tono, más luminoso: sobre fondo
   * oscuro el valor de tema claro no llega al contraste mínimo.
   */
  oscuro: string;
};

export const ACENTOS: Record<NombreDeAcento, Acento> = {
  pino: { etiqueta: "Pino", claro: "#1F5C4A", oscuro: "#6FBFA2" },
  marino: { etiqueta: "Marino", claro: "#1B3A5C", oscuro: "#8AB4DC" },
  ciruela: { etiqueta: "Ciruela", claro: "#5B2A4E", oscuro: "#D19BC4" },
  ladrillo: { etiqueta: "Ladrillo", claro: "#8C3A24", oscuro: "#E8A18C" },
  grafito: { etiqueta: "Grafito", claro: "#33383A", oscuro: "#B4BDBE" },
};

export const ACENTO_POR_DEFECTO: NombreDeAcento = "pino";
export const TEMA_POR_DEFECTO: Tema = "claro";

/** Claves de `localStorage`. También las usa el script que corre antes del primer pintado. */
export const CLAVE_TEMA = "linkyouth.tema";
export const CLAVE_ACENTO = "linkyouth.acento";

export function esTema(valor: unknown): valor is Tema {
  return TEMAS.includes(valor as Tema);
}

export function esNombreDeAcento(valor: unknown): valor is NombreDeAcento {
  return NOMBRES_DE_ACENTO.includes(valor as NombreDeAcento);
}

/**
 * Reglas CSS de los cinco acentos, para inyectar una sola vez en el `<head>`.
 *
 * Se generan desde `ACENTOS` en lugar de escribirse a mano en `globals.css`
 * para que agregar un color sea tocar un solo archivo.
 */
export function reglasDeAcento(): string {
  return Object.entries(ACENTOS)
    .map(
      ([nombre, acento]) =>
        `[data-acento="${nombre}"]{--ly-acento:${acento.claro}}` +
        `[data-tema="oscuro"][data-acento="${nombre}"]{--ly-acento:${acento.oscuro}}`,
    )
    .join("");
}
