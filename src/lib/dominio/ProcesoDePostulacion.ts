import type { EstadoPostulacion } from "@/lib/data/tipos";

/**
 * Las tres etapas visibles del proceso.
 *
 * No son los cinco estados de la base: `aceptada`, `rechazada` y `cancelada`
 * caen todas en la última. Quien busca trabajo quiere saber en qué punto
 * está, no cuántos valores admite la columna.
 */
export const ETAPAS = ["Enviada", "En revisión", "Resolución"] as const;
export type Etapa = (typeof ETAPAS)[number];

const ETIQUETAS: Record<EstadoPostulacion, string> = {
  pendiente: "Enviada",
  en_revision: "En revisión",
  aceptada: "Aceptada",
  rechazada: "No seleccionada",
  cancelada: "Cancelada por vos",
};

/** Estados en los que el postulante todavía puede cancelar (RF3.8). */
const CANCELABLES: readonly EstadoPostulacion[] = ["pendiente", "en_revision"];

/**
 * Qué significa el estado de una postulación para quien la hizo.
 *
 * Concentra las tres preguntas que las pantallas le hacían por separado: cómo
 * se lee, en qué etapa está y si todavía se puede cancelar. Estaban repartidas
 * entre `formato.ts` y la propia página, que es donde una regla de negocio se
 * desincroniza sin que nadie lo note.
 */
export class ProcesoDePostulacion {
  constructor(private readonly estado: EstadoPostulacion) {}

  /**
   * El texto no es una traducción literal del valor de la base: `rechazada`
   * se lee «No seleccionada» y `pendiente`, «Enviada». Es deliberado, porque
   * lo lee alguien que quería ese trabajo.
   */
  get etiqueta(): string {
    return ETIQUETAS[this.estado];
  }

  /** Índice de `ETAPAS` en el que está el proceso. */
  get etapa(): number {
    if (this.estado === "pendiente") return 0;
    if (this.estado === "en_revision") return 1;

    return 2;
  }

  get cancelable(): boolean {
    return CANCELABLES.includes(this.estado);
  }

  /** El proceso terminó sin puesto: se rechazó, o lo canceló el postulante. */
  get cerradoSinPuesto(): boolean {
    return this.estado === "rechazada" || this.estado === "cancelada";
  }

  get aceptada(): boolean {
    return this.estado === "aceptada";
  }

  alcanzo(etapa: number): boolean {
    return etapa <= this.etapa;
  }
}
