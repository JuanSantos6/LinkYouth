/**
 * El Interview Lab del joven: cuatro tests externos para conocerse y
 * preparar entrevistas, con el resultado que el joven carga a mano.
 *
 * Ninguno tiene integración: 16Personalities no tiene API y la de JobCannon
 * es paga (plan Scale) y no hay clave. El joven hace cada test en su sitio y
 * vuelve a cargar lo que le dio. Ver `docs/decisiones.md`, 2026-10-22.
 *
 * «Obligatorio» quiere decir que se destaca mientras falta y que el inicio
 * avisa; no bloquea nada: postularse no depende de esto. Y ningún resultado
 * entra en la compatibilidad, los filtros ni el orden de candidatos.
 */

export type ClaveDeTest =
  "personalidad" | "psicometrico" | "juicio_situacional" | "aptitudes";

/** Los tres de JobCannon: los que guarda `resultados_de_tests`. */
export type ClaveDeTestOpcional = Exclude<ClaveDeTest, "personalidad">;

export type TestDeInterviewLab = {
  clave: ClaveDeTest;
  nombre: string;
  /** Una o dos frases: qué mide y qué da. */
  descripcion: string;
  /** Lo que dice el sitio del test. */
  minutos: number;
  url: string;
  sitio: string;
  obligatorio: boolean;
};

/**
 * Duraciones y descripciones según la página de cada test, consultadas el
 * 2026-10-22.
 */
export const TESTS: readonly TestDeInterviewLab[] = [
  {
    clave: "personalidad",
    nombre: "Test de personalidad",
    descripcion:
      "Te da uno de los 16 tipos de personalidad: cómo te relacionás, decidís y te organizás.",
    minutos: 10,
    url: "https://www.16personalities.com/es",
    sitio: "16Personalities",
    obligatorio: true,
  },
  {
    clave: "psicometrico",
    nombre: "Test psicométrico",
    descripcion:
      "30 preguntas sobre datos numéricos, inferencia verbal, patrones y detección de errores. Da una banda general y un puntaje por área.",
    minutos: 20,
    url: "https://jobcannon.io/es/tests/psychometric-test",
    sitio: "JobCannon",
    obligatorio: false,
  },
  {
    clave: "juicio_situacional",
    nombre: "Juicio situacional",
    descripcion:
      "25 situaciones de trabajo con cuatro opciones cada una. Mide cómo priorizás, comunicás y ponés límites.",
    minutos: 12,
    url: "https://jobcannon.io/es/tests/situational-judgement",
    sitio: "JobCannon",
    obligatorio: false,
  },
  {
    clave: "aptitudes",
    nombre: "Test de aptitudes",
    descripcion:
      "30 preguntas de razonamiento verbal, numérico, lógico y abstracto. Da una banda general y un puntaje por sección.",
    minutos: 14,
    url: "https://jobcannon.io/es/tests/aptitude-test",
    sitio: "JobCannon",
    obligatorio: false,
  },
];

export const CLAVES_OPCIONALES: readonly ClaveDeTestOpcional[] = [
  "psicometrico",
  "juicio_situacional",
  "aptitudes",
];

export function esTestOpcional(valor: unknown): valor is ClaveDeTestOpcional {
  return (
    typeof valor === "string" &&
    (CLAVES_OPCIONALES as readonly string[]).includes(valor)
  );
}

export function testDe(clave: ClaveDeTest): TestDeInterviewLab {
  return TESTS.find((t) => t.clave === clave)!;
}

/** Los mismos límites que los `check` de la migración 010. */
export const LARGO_MAXIMO_PUNTAJE = 40;
export const LARGO_MAXIMO_RESULTADO = 280;

/**
 * Lo que carga el joven de un test de JobCannon. Los dos campos son
 * opcionales: haberlo hecho ya cuenta. Devuelve el error de cada campo.
 */
export function validarResultado(datos: {
  puntaje: string;
  resultado: string;
}): Partial<Record<"puntaje" | "resultado", string>> {
  const errores: Partial<Record<"puntaje" | "resultado", string>> = {};
  if (datos.puntaje.length > LARGO_MAXIMO_PUNTAJE)
    errores.puntaje = `Hasta ${LARGO_MAXIMO_PUNTAJE} caracteres: por ejemplo, «Excepcional» o «24 de 30».`;
  if (datos.resultado.length > LARGO_MAXIMO_RESULTADO)
    errores.resultado = `Hasta ${LARGO_MAXIMO_RESULTADO} caracteres: el resultado principal, en una o dos frases.`;
  return errores;
}

/** Quién dice que el resultado es ese. Hoy, siempre el joven. */
export function etiquetaDeOrigen(origen: string): string {
  return origen === "verificado"
    ? "Verificado por JobCannon"
    : "Declarado por el postulante";
}

/** Cuántos tests completó y si falta el obligatorio. */
export class ProgresoDeInterviewLab {
  private constructor(
    private readonly fechas: ReadonlyMap<ClaveDeTest, string>,
  ) {}

  static de(datos: {
    personalidad: { cargada_en: string } | null;
    tests: readonly { test: string; cargado_en: string }[];
  }): ProgresoDeInterviewLab {
    const fechas = new Map<ClaveDeTest, string>();
    if (datos.personalidad)
      fechas.set("personalidad", datos.personalidad.cargada_en);
    for (const t of datos.tests)
      if (esTestOpcional(t.test)) fechas.set(t.test, t.cargado_en);
    return new ProgresoDeInterviewLab(fechas);
  }

  get total(): number {
    return TESTS.length;
  }

  get completados(): number {
    return this.fechas.size;
  }

  /** «1 de 4 completados». */
  get texto(): string {
    return `${this.completados} de ${this.total} completados`;
  }

  /** De 0 a 100, para la barra. */
  get porcentaje(): number {
    return Math.round((this.completados / this.total) * 100);
  }

  /** Cuándo cargó el resultado, o `null` si está pendiente. */
  completadoEl(clave: ClaveDeTest): string | null {
    return this.fechas.get(clave) ?? null;
  }

  /** El aviso del inicio: mientras falte el obligatorio. No bloquea nada. */
  get faltaElObligatorio(): boolean {
    return TESTS.some((t) => t.obligatorio && !this.fechas.has(t.clave));
  }
}
