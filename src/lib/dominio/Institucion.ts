import { iniciales } from "@/lib/formato";

/**
 * Una institución educativa, identificada por su nombre.
 *
 * **No hay tabla de instituciones.** `db/schema.sql` guarda
 * `formaciones.institucion` como texto libre: quien completa su formación
 * escribe «Universidad de la República» a mano. Así que el identificador de la
 * URL se deriva del nombre en lugar de ser una clave primaria.
 *
 * Eso trae dos consecuencias que conviene tener a la vista:
 *
 * 1. Dos grafías del mismo lugar —«UTU» y «U.T.U.»— son dos instituciones
 *    distintas para la plataforma. La normalización arregla mayúsculas,
 *    acentos y espacios, no las abreviaturas.
 * 2. El identificador cambia si alguien corrige el nombre. No se puede
 *    guardar en ningún lado ni compartir como enlace permanente.
 *
 * La salida es una tabla `instituciones` con su fila, su logo y su clave
 * estable (deuda 7.x de `docs/arquitectura.md`). Mientras tanto, esto es lo
 * que se puede hacer sin inventar columnas que el equipo no decidió.
 */
export class Institucion {
  constructor(readonly nombre: string) {}

  /**
   * El identificador que va en `/institucion/[id]`.
   *
   * Sin acentos, en minúsculas y con guiones: es lo que sobrevive a un copiar
   * y pegar desde un chat sin convertirse en un `%C3%BA`.
   */
  get id(): string {
    return this.nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /** Las iniciales, para el recuadro cuando no hay logo —que es siempre. */
  get iniciales(): string {
    return iniciales(this.nombre);
  }

  /** Si este nombre corresponde al identificador de una URL. */
  correspondeA(id: string): boolean {
    return this.id === id;
  }
}
