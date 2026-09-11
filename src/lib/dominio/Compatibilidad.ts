import type { Vacante } from "@/lib/data/tipos";

/** Lo que una persona declara saber y hacia dónde quiere ir. */
export type PerfilDeclarado = {
  tags: string[];
  habilidades: string[];
};

const PERFIL_VACIO: PerfilDeclarado = { tags: [], habilidades: [] };

/** A partir de acá la compatibilidad se considera alta (RF3.5.2). */
const UMBRAL_ALTA = 70;

function normalizar(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/**
 * Cuánto de lo que pide una vacante ya tiene el postulante.
 *
 * Es una clase y no una función suelta porque el resultado se usa de tres
 * maneras distintas —el porcentaje, si una etiqueta puntual coincide y si el
 * total alcanza para destacar la vacante— y las tres tienen que salir del
 * mismo cálculo. Devolver solo el número obligaba a que cada componente
 * rehiciera la comparación por su cuenta.
 *
 * Solo mira datos públicos: los tags visibles de la vacante y sus
 * habilidades. El puntaje de matching de RF3.9 es otra cosa —usa los tags
 * ocultos, se calcula en la base y lo ve únicamente la empresa— y no pasa
 * por acá.
 */
export class Compatibilidad {
  private constructor(
    private readonly requisitos: readonly string[],
    private readonly cubiertos: ReadonlySet<string>,
  ) {}

  static entre(
    vacante: Pick<Vacante, "tags" | "habilidades">,
    perfil: PerfilDeclarado = PERFIL_VACIO,
  ): Compatibilidad {
    const requisitos = [...vacante.habilidades, ...vacante.tags];
    const declarados = new Set(
      [...perfil.habilidades, ...perfil.tags].map(normalizar),
    );

    const cubiertos = new Set(
      requisitos
        .map(normalizar)
        .filter((requisito) => declarados.has(requisito)),
    );

    return new Compatibilidad(requisitos, cubiertos);
  }

  /** Una vacante sin tags ni habilidades no se puede comparar con nada. */
  get medible(): boolean {
    return this.requisitos.length > 0;
  }

  get porcentaje(): number {
    if (!this.medible) return 0;

    return Math.round((100 * this.cubiertos.size) / this.requisitos.length);
  }

  get alta(): boolean {
    return this.medible && this.porcentaje >= UMBRAL_ALTA;
  }

  /** Si el perfil ya declara ese tag o esa habilidad. */
  cubre(requisito: string): boolean {
    return this.cubiertos.has(normalizar(requisito));
  }
}
