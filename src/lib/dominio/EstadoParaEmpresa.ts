import type { EstadoPostulacion } from "@/lib/data/tipos";

/**
 * Cómo nombra la empresa cada estado de una postulación.
 *
 * La base guarda los valores de siempre (`pendiente`, `en_revision`,
 * `aceptada`, `rechazada`) y la empresa los lee como Nueva, En revisión,
 * Seleccionada y Descartada. No es una traducción literal a propósito: es el
 * vocabulario de quien selecciona, como `ProcesoDePostulacion` tiene el de
 * quien se postuló. La misma postulación se lee distinto desde cada lado.
 */
const ETIQUETAS: Record<EstadoPostulacion, string> = {
  pendiente: "Nueva",
  en_revision: "En revisión",
  entrevista: "Entrevista",
  aceptada: "Seleccionada",
  rechazada: "Descartada",
  cancelada: "Se retiró",
};

/** El botón que lleva a cada estado, con el verbo de lo que pasa. */
const ACCIONES: Partial<Record<EstadoPostulacion, string>> = {
  en_revision: "Pasar a revisión",
  entrevista: "Citar a entrevista",
  aceptada: "Seleccionar",
  rechazada: "Descartar",
};

/**
 * A qué estados puede llevar la empresa una postulación desde cada uno.
 *
 * Solo hacia adelante: una postulación vista no vuelve a ser «nueva», y quien
 * está en entrevista no vuelve a revisión. Los tres estados finales no se
 * mueven, igual que en la base (`postulacion_transicion_valida`).
 */
const SIGUIENTES: Record<EstadoPostulacion, readonly EstadoPostulacion[]> = {
  pendiente: ["en_revision", "entrevista", "aceptada", "rechazada"],
  en_revision: ["entrevista", "aceptada", "rechazada"],
  entrevista: ["aceptada", "rechazada"],
  aceptada: [],
  rechazada: [],
  cancelada: [],
};

/** Tono de la insignia. Ninguno se lee solo por color: va siempre el texto. */
const TONOS: Record<
  EstadoPostulacion,
  "neutro" | "acento" | "acreditado" | "apagado"
> = {
  pendiente: "acento",
  en_revision: "neutro",
  entrevista: "neutro",
  aceptada: "acreditado",
  rechazada: "apagado",
  cancelada: "apagado",
};

/** El orden en que la empresa los ve en filtros y listados. */
export const ESTADOS_PARA_EMPRESA = [
  "pendiente",
  "en_revision",
  "entrevista",
  "aceptada",
  "rechazada",
] as const satisfies readonly EstadoPostulacion[];

/** Lo que significa un estado de postulación para la empresa que la recibió. */
export class EstadoParaEmpresa {
  constructor(private readonly estado: EstadoPostulacion) {}

  get etiqueta(): string {
    return ETIQUETAS[this.estado];
  }

  get tono(): (typeof TONOS)[EstadoPostulacion] {
    return TONOS[this.estado];
  }

  /** «Nueva»: nadie de la empresa la miró todavía. */
  get esNueva(): boolean {
    return this.estado === "pendiente";
  }

  /** Quien se retiró no comparte más sus datos con la empresa. */
  get seRetiro(): boolean {
    return this.estado === "cancelada";
  }

  get final(): boolean {
    return SIGUIENTES[this.estado].length === 0;
  }

  /** Las acciones que se ofrecen en pantalla, con su texto. */
  get siguientes(): { estado: EstadoPostulacion; accion: string }[] {
    return SIGUIENTES[this.estado].map((estado) => ({
      estado,
      accion: ACCIONES[estado] ?? ETIQUETAS[estado],
    }));
  }

  /**
   * Si la empresa puede pasar de este estado a `destino`. La acción de
   * servidor lo pregunta antes de escribir: la política de RLS solo mira el
   * destino, y el disparador de la base solo los estados finales.
   */
  puedePasarA(destino: EstadoPostulacion): boolean {
    return SIGUIENTES[this.estado].includes(destino);
  }
}
