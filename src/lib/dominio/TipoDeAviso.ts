/**
 * Qué clase de aviso es cada fila de `notificaciones` (RF6.1, RF6.2), para
 * mostrarlo con su rótulo y su tono.
 *
 * `tipo` lo escriben los disparadores de la base (migración 007). Los avisos
 * anteriores a esa migración dicen solo `postulacion` o `evento`: se leen como
 * un cambio genérico, sin inventarles un estado que no dicen.
 */

export type TonoDeAviso = "logro" | "neutro" | "novedad" | "baja";

type Descripcion = { etiqueta: string; tono: TonoDeAviso };

const TIPOS: Record<string, Descripcion> = {
  postulacion_seleccionada: { etiqueta: "Te seleccionaron", tono: "logro" },
  postulacion_descartada: { etiqueta: "No siguió adelante", tono: "baja" },
  postulacion_entrevista: { etiqueta: "Entrevista", tono: "novedad" },
  postulacion_en_revision: { etiqueta: "En revisión", tono: "neutro" },
  postulacion_recibida: { etiqueta: "Nueva postulación", tono: "novedad" },
  inscripcion_recibida: { etiqueta: "Nueva inscripción", tono: "neutro" },
  evento_cancelado: { etiqueta: "Evento cancelado", tono: "baja" },
  evento: { etiqueta: "Evento", tono: "neutro" },
  postulacion: { etiqueta: "Postulación", tono: "neutro" },
};

const GENERICO: Descripcion = { etiqueta: "Aviso", tono: "neutro" };

export class TipoDeAviso {
  readonly etiqueta: string;
  readonly tono: TonoDeAviso;

  constructor(tipo: string) {
    ({ etiqueta: this.etiqueta, tono: this.tono } = TIPOS[tipo] ?? GENERICO);
  }

  /**
   * Hasta qué número se muestra en la campana. Más allá, «9+»: el número
   * exacto no cambia lo que la persona va a hacer, y no rompe el círculo.
   */
  static readonly TOPE_DEL_CONTADOR = 9;

  static textoDelContador(sinLeer: number): string | null {
    if (sinLeer <= 0) return null;
    return sinLeer > this.TOPE_DEL_CONTADOR
      ? `${this.TOPE_DEL_CONTADOR}+`
      : String(sinLeer);
  }

  /** Nombre accesible de la campana: «Avisos, 3 sin leer». */
  static nombreDeLaCampana(sinLeer: number): string {
    if (sinLeer <= 0) return "Avisos";
    return `Avisos, ${sinLeer} sin leer`;
  }
}
