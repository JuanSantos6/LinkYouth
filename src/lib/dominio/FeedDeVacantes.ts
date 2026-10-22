import type { Vacante } from "@/lib/data/tipos";

import { Compatibilidad, type PerfilDeclarado } from "./Compatibilidad";

export type EntradaDelFeed = {
  vacante: Vacante;
  /**
   * Solo para ordenar: no se muestra. La compatibilidad y las coincidencias
   * son de la empresa (RF3.9.2).
   */
  compatibilidad: Compatibilidad;
};

/**
 * El orden del feed de vacantes.
 *
 * Vive en su propia clase porque es una regla de producto, no una decisión de
 * maquetado: primero lo más compatible con lo que la persona ya acreditó y,
 * a igual compatibilidad, lo más reciente. La página solo recorre el
 * resultado.
 */
export class FeedDeVacantes {
  private constructor(readonly entradas: readonly EntradaDelFeed[]) {}

  static armar(
    vacantes: readonly Vacante[],
    /** Sin perfil —quien mira no tiene sesión—, todas miden cero: queda el orden por fecha. */
    perfil?: PerfilDeclarado,
  ): FeedDeVacantes {
    const evaluadas = vacantes
      .map((vacante): EntradaDelFeed => ({
        vacante,
        compatibilidad: Compatibilidad.entre(vacante, perfil),
      }))
      .sort((una, otra) => {
        const diferencia =
          otra.compatibilidad.porcentaje - una.compatibilidad.porcentaje;

        if (diferencia !== 0) return diferencia;

        return (
          new Date(otra.vacante.creada_en).getTime() -
          new Date(una.vacante.creada_en).getTime()
        );
      });

    return new FeedDeVacantes(evaluadas);
  }

  get vacio(): boolean {
    return this.entradas.length === 0;
  }

  get cantidad(): number {
    return this.entradas.length;
  }
}
