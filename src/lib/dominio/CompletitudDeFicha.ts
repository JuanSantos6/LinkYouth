import type { PerfilCompleto } from "@/lib/data/tipos";

import { ReglasDeRegistro } from "./ReglasDeRegistro";

export type PasoDeFicha = {
  clave: "intereses" | "habilidades" | "bio" | "formacion";
  hecho: boolean;
  /** Cómo se dice cuando ya está. */
  logrado: string;
  /** Qué falta y por qué importa, cuando no está. */
  pendiente: string;
};

/**
 * Qué le falta a una ficha para estar completa, y por qué importa cada cosa.
 *
 * Es la guía de arriba de `/perfil`: una ficha incompleta encuentra menos
 * búsquedas, y quien recién empieza no tiene por qué saber qué mira una
 * empresa. Las reglas viven acá y no en el componente (CLAUDE.md): la
 * pantalla solo recorre los pasos.
 */
export class CompletitudDeFicha {
  private constructor(readonly pasos: readonly PasoDeFicha[]) {}

  static de(
    perfil: Pick<
      PerfilCompleto,
      "tags" | "habilidades" | "bio" | "formaciones"
    >,
  ): CompletitudDeFicha {
    return new CompletitudDeFicha([
      {
        clave: "intereses",
        hecho: perfil.tags.length >= ReglasDeRegistro.TAGS_MINIMOS,
        logrado: "Elegiste tus intereses",
        pendiente: `Elegí al menos ${ReglasDeRegistro.TAGS_MINIMOS} intereses: con eso se ordena tu feed.`,
      },
      {
        clave: "habilidades",
        hecho: perfil.habilidades.length > 0,
        logrado: "Sumaste tus habilidades",
        pendiente:
          "Sumá tus habilidades: es lo que cada búsqueda compara con lo que pide.",
      },
      {
        clave: "bio",
        hecho: Boolean(perfil.bio?.trim()),
        logrado: "Escribiste sobre vos",
        pendiente:
          "Escribí dos líneas sobre vos: es lo primero que lee una empresa.",
      },
      {
        clave: "formacion",
        hecho: perfil.formaciones.length > 0,
        logrado: "Cargaste tu formación",
        pendiente:
          "Sumá tu formación, terminada o en curso: las empresas la miran para saber qué estás estudiando.",
      },
    ]);
  }

  get hechos(): number {
    return this.pasos.filter((paso) => paso.hecho).length;
  }

  get total(): number {
    return this.pasos.length;
  }

  get completa(): boolean {
    return this.hechos === this.total;
  }
}
