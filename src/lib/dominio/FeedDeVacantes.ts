import type { Vacante } from "@/lib/data/tipos";

import { Compatibilidad, type PerfilDeclarado } from "./Compatibilidad";

export type EntradaDelFeed = {
  vacante: Vacante;
  compatibilidad: Compatibilidad;
  /**
   * La vacante que encabeza el listado por compatibilidad alta. Es la única
   * que lleva el canto ámbar: si se destacaran varias, ninguna estaría
   * destacada.
   */
  destacada: boolean;
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
    perfil: PerfilDeclarado,
  ): FeedDeVacantes {
    const evaluadas = vacantes
      .map((vacante) => ({
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

    // Solo se destaca la primera, y solo si su compatibilidad es alta de
    // verdad: encabezar un listado flojo no es un logro.
    const destacar = evaluadas[0]?.compatibilidad.alta ?? false;

    return new FeedDeVacantes(
      evaluadas.map((entrada, indice) => ({
        ...entrada,
        destacada: destacar && indice === 0,
      })),
    );
  }

  get vacio(): boolean {
    return this.entradas.length === 0;
  }

  get cantidad(): number {
    return this.entradas.length;
  }
}
