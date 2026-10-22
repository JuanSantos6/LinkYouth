/**
 * Cuánto de lo que pide una búsqueda declara una persona que se postuló, visto
 * desde la empresa (RF3.4.2, RF3.9).
 *
 * Son dos números y se muestran por separado, sin fundirlos en un porcentaje:
 *
 * - **Habilidades**: cuántas de las que pide la búsqueda declara la persona.
 *   Son *declaradas*: la plataforma todavía no acredita ninguna, y la empresa
 *   tiene que saberlo para no leer más de lo que hay.
 * - **Intereses clave** (RF3.9): cuántos de los tags ocultos de la búsqueda
 *   coinciden con los intereses públicos de la persona. Solo la empresa ve
 *   este número, porque solo ella conoce los tags ocultos.
 *
 * Las habilidades ocultas (RF3.1.6, migración 008) cuentan como pedidas igual
 * que las públicas: la empresa las pide, solo que sin publicarlas.
 * `requisitosDe` arma la lista.
 *
 * Un porcentaje combinado esconde qué parte pesa; dos cuentas («3 de 4
 * habilidades», «2 de 3 intereses clave») se leen sin explicación.
 *
 * Distinta de `Compatibilidad`, que es la vista del joven: aquella mezcla
 * habilidades y tags públicos de la vacante y nunca ve los ocultos.
 */
export class CoincidenciaDeCandidato {
  private constructor(
    private readonly pedidas: readonly string[],
    private readonly declaradas: ReadonlySet<string>,
    private readonly clave: readonly string[],
    private readonly intereses: ReadonlySet<string>,
  ) {}

  /** Lo que pide una búsqueda, en nombres: públicas y ocultas juntas. */
  static requisitosDe(busqueda: {
    habilidades: readonly { nombre: string }[];
    habilidadesOcultas?: readonly { nombre: string }[];
    tagsOcultos: readonly { nombre: string }[];
  }): { habilidades: string[]; tagsOcultos: string[] } {
    return {
      habilidades: [
        ...busqueda.habilidades,
        ...(busqueda.habilidadesOcultas ?? []),
      ].map((h) => h.nombre),
      tagsOcultos: busqueda.tagsOcultos.map((t) => t.nombre),
    };
  }

  static entre(
    busqueda: { habilidades: string[]; tagsOcultos: string[] },
    persona: { habilidades: string[]; tags: string[] },
  ): CoincidenciaDeCandidato {
    const normalizar = (nombre: string) => nombre.trim().toLowerCase();
    return new CoincidenciaDeCandidato(
      busqueda.habilidades,
      new Set(persona.habilidades.map(normalizar)),
      busqueda.tagsOcultos,
      new Set(persona.tags.map(normalizar)),
    );
  }

  /** Si la persona declara esa habilidad. */
  declara(habilidad: string): boolean {
    return this.declaradas.has(habilidad.trim().toLowerCase());
  }

  /** Si la búsqueda pide esa habilidad. */
  pide(habilidad: string): boolean {
    const buscada = habilidad.trim().toLowerCase();
    return this.pedidas.some((h) => h.trim().toLowerCase() === buscada);
  }

  /** Si ese interés es uno de los intereses clave (tags ocultos) de la búsqueda. */
  esInteresClave(tag: string): boolean {
    const buscado = tag.trim().toLowerCase();
    return this.clave.some((t) => t.trim().toLowerCase() === buscado);
  }

  /** Las habilidades que pide la búsqueda y la persona no declara. */
  get habilidadesQueNoDeclara(): string[] {
    return this.pedidas.filter((h) => !this.declara(h));
  }

  get habilidadesCubiertas(): number {
    return this.pedidas.filter((h) => this.declara(h)).length;
  }

  get habilidadesPedidas(): number {
    return this.pedidas.length;
  }

  get interesesClaveCubiertos(): number {
    return this.clave.filter((t) => this.intereses.has(t.trim().toLowerCase()))
      .length;
  }

  get interesesClave(): number {
    return this.clave.length;
  }

  /** Proporción de 0 a 1; una búsqueda sin requisitos no ordena a nadie. */
  private static proporcion(cubiertos: number, total: number): number {
    return total === 0 ? 0 : cubiertos / total;
  }

  /**
   * Compara dos candidatos para ordenarlos de más a menos coincidencia:
   * primero por habilidades, después por intereses clave. A igualdad, quien se
   * postuló antes: es lo más parecido a una fila justa.
   */
  static comparar(
    a: { coincidencia: CoincidenciaDeCandidato; fecha: string },
    b: { coincidencia: CoincidenciaDeCandidato; fecha: string },
  ): number {
    const p = CoincidenciaDeCandidato.proporcion;
    const habilidades =
      p(
        b.coincidencia.habilidadesCubiertas,
        b.coincidencia.habilidadesPedidas,
      ) -
      p(a.coincidencia.habilidadesCubiertas, a.coincidencia.habilidadesPedidas);
    if (habilidades !== 0) return habilidades;

    const clave =
      p(b.coincidencia.interesesClaveCubiertos, b.coincidencia.interesesClave) -
      p(a.coincidencia.interesesClaveCubiertos, a.coincidencia.interesesClave);
    if (clave !== 0) return clave;

    return a.fecha.localeCompare(b.fecha);
  }

  /**
   * Las postulaciones de una búsqueda, cada una con su coincidencia, de más a
   * menos coincidencia. Quienes se retiraron van al final: no hay nada que
   * evaluar de ellos.
   */
  static ordenar<
    P extends {
      habilidades: string[];
      tags: string[];
      creada_en: string;
      estado: string;
    },
  >(
    busqueda: { habilidades: string[]; tagsOcultos: string[] },
    postulaciones: P[],
  ): { postulacion: P; coincidencia: CoincidenciaDeCandidato }[] {
    return postulaciones
      .map((postulacion) => ({
        postulacion,
        coincidencia: CoincidenciaDeCandidato.entre(busqueda, postulacion),
      }))
      .sort((a, b) => {
        const retiroA = a.postulacion.estado === "cancelada";
        const retiroB = b.postulacion.estado === "cancelada";
        if (retiroA !== retiroB) return retiroA ? 1 : -1;
        return CoincidenciaDeCandidato.comparar(
          { coincidencia: a.coincidencia, fecha: a.postulacion.creada_en },
          { coincidencia: b.coincidencia, fecha: b.postulacion.creada_en },
        );
      });
  }
}
