/**
 * El resultado del test de 16Personalities que el joven carga en su perfil
 * (migración 009).
 *
 * El sitio no tiene API: el joven hace el test allá y elige acá el tipo que
 * le dio. La base guarda solo el código («INTJ-T») y valida su forma; el
 * nombre en español, el grupo y la variante salen de acá, así un cambio de
 * nombre no obliga a tocar filas.
 *
 * Es un dato declarado: LinkYouth no lo valida ni lo usa para nada que
 * ordene o filtre. No entra en `Compatibilidad` ni en
 * `CoincidenciaDeCandidato` (ver `docs/decisiones.md`, 2026-10-22).
 */

export type GrupoDePersonalidad =
  "analistas" | "diplomaticos" | "centinelas" | "exploradores";

export type Variante = "A" | "T";

/** Los 16 tipos, en el orden en que se ofrecen: por grupo. */
const TIPOS = [
  ["INTJ", "Arquitecto", "analistas"],
  ["INTP", "Lógico", "analistas"],
  ["ENTJ", "Comandante", "analistas"],
  ["ENTP", "Innovador", "analistas"],
  ["INFJ", "Abogado", "diplomaticos"],
  ["INFP", "Mediador", "diplomaticos"],
  ["ENFJ", "Protagonista", "diplomaticos"],
  ["ENFP", "Activista", "diplomaticos"],
  ["ISTJ", "Logista", "centinelas"],
  ["ISFJ", "Defensor", "centinelas"],
  ["ESTJ", "Ejecutivo", "centinelas"],
  ["ESFJ", "Cónsul", "centinelas"],
  ["ISTP", "Virtuoso", "exploradores"],
  ["ISFP", "Aventurero", "exploradores"],
  ["ESTP", "Emprendedor", "exploradores"],
  ["ESFP", "Animador", "exploradores"],
] as const satisfies readonly (readonly [
  string,
  string,
  GrupoDePersonalidad,
])[];

export type Letras = (typeof TIPOS)[number][0];

export const GRUPOS: Record<GrupoDePersonalidad, string> = {
  analistas: "Analistas",
  diplomaticos: "Diplomáticos",
  centinelas: "Centinelas",
  exploradores: "Exploradores",
};

export const VARIANTES: Record<Variante, string> = {
  A: "Asertiva",
  T: "Turbulenta",
};

/** Lo que tiene que cumplir el código: el mismo `check` de la base. */
const FORMA = /^([EI][SN][TF][JP])-([AT])$/;

export class TipoDePersonalidad {
  private constructor(
    readonly letras: Letras,
    readonly variante: Variante,
    readonly nombre: string,
    readonly grupo: GrupoDePersonalidad,
  ) {}

  /** El tipo de un código guardado, o `null` si no es uno de los 16 con variante. */
  static de(codigo: string | null | undefined): TipoDePersonalidad | null {
    const partes = FORMA.exec(codigo ?? "");
    if (!partes) return null;
    return TipoDePersonalidad.armar(partes[1], partes[2]);
  }

  /** El tipo que se arma con lo que eligió el joven en el formulario. */
  static armar(letras: string, variante: string): TipoDePersonalidad | null {
    const fila = TIPOS.find(([l]) => l === letras);
    if (!fila || (variante !== "A" && variante !== "T")) return null;
    return new TipoDePersonalidad(fila[0], variante, fila[1], fila[2]);
  }

  /** Las 16 opciones de la lista, agrupadas como se muestran. */
  static opciones(): {
    grupo: GrupoDePersonalidad;
    titulo: string;
    tipos: { letras: Letras; nombre: string }[];
  }[] {
    return (Object.keys(GRUPOS) as GrupoDePersonalidad[]).map((grupo) => ({
      grupo,
      titulo: GRUPOS[grupo],
      tipos: TIPOS.filter(([, , g]) => g === grupo).map(([letras, nombre]) => ({
        letras,
        nombre,
      })),
    }));
  }

  /** Lo que guarda la base: «INTJ-T». */
  get codigo(): string {
    return `${this.letras}-${this.variante}`;
  }

  get nombreDelGrupo(): string {
    return GRUPOS[this.grupo];
  }

  get nombreDeLaVariante(): string {
    return VARIANTES[this.variante];
  }
}
