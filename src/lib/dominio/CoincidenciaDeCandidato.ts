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
}
