/** RF8.1 — Qué tiene que tener una reseña para publicarse. */
export class ReglasDeResenia {
  static readonly COMENTARIO_MIN = 20;
  static readonly COMENTARIO_MAX = 1000;

  /** Qué está mal, campo por campo. Vacío si se puede publicar. */
  static problemas(calificacion: number, comentario: string) {
    const campos: Record<string, string> = {};
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5)
      campos.calificacion = "Elegí de 1 a 5 estrellas.";
    if (comentario.length < this.COMENTARIO_MIN)
      campos.comentario = `Contá un poco más: al menos ${this.COMENTARIO_MIN} caracteres.`;
    else if (comentario.length > this.COMENTARIO_MAX)
      campos.comentario = `Hasta ${this.COMENTARIO_MAX} caracteres.`;
    return campos;
  }
}
