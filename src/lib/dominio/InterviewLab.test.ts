import { describe, expect, it } from "vitest";

import { CoincidenciaDeCandidato } from "./CoincidenciaDeCandidato";
import {
  CLAVES_OPCIONALES,
  esTestOpcional,
  etiquetaDeOrigen,
  ProgresoDeInterviewLab,
  TESTS,
  validarResultado,
} from "./InterviewLab";

describe("Interview Lab", () => {
  it("tiene cuatro tests y solo el de personalidad es obligatorio", () => {
    expect(TESTS.map((t) => t.clave)).toEqual([
      "personalidad",
      "psicometrico",
      "juicio_situacional",
      "aptitudes",
    ]);
    expect(TESTS.filter((t) => t.obligatorio).map((t) => t.clave)).toEqual([
      "personalidad",
    ]);
    for (const t of TESTS) expect(t.url).toMatch(/^https:\/\//);
  });

  it("los opcionales son los mismos que acepta el `check` de la migración 010", () => {
    expect(CLAVES_OPCIONALES).toEqual([
      "psicometrico",
      "juicio_situacional",
      "aptitudes",
    ]);
    expect(esTestOpcional("personalidad")).toBe(false);
    expect(esTestOpcional("aptitudes")).toBe(true);
  });

  it("cuenta los completados y avisa mientras falta el obligatorio", () => {
    const nada = ProgresoDeInterviewLab.de({ personalidad: null, tests: [] });
    expect(nada.texto).toBe("0 de 4 completados");
    expect(nada.faltaElObligatorio).toBe(true);

    const soloOpcional = ProgresoDeInterviewLab.de({
      personalidad: null,
      tests: [{ test: "aptitudes", cargado_en: "2026-10-22T12:00:00Z" }],
    });
    expect(soloOpcional.texto).toBe("1 de 4 completados");
    expect(soloOpcional.faltaElObligatorio).toBe(true);
    expect(soloOpcional.completadoEl("aptitudes")).toBe("2026-10-22T12:00:00Z");
    expect(soloOpcional.completadoEl("psicometrico")).toBeNull();

    const conPersonalidad = ProgresoDeInterviewLab.de({
      personalidad: { cargada_en: "2026-10-22T12:00:00Z" },
      tests: [],
    });
    expect(conPersonalidad.faltaElObligatorio).toBe(false);
    expect(conPersonalidad.porcentaje).toBe(25);
  });

  it("ignora tests que no conoce", () => {
    const p = ProgresoDeInterviewLab.de({
      personalidad: null,
      tests: [{ test: "otro", cargado_en: "2026-10-22T12:00:00Z" }],
    });
    expect(p.completados).toBe(0);
  });

  it("acepta campos vacíos y corta los largos", () => {
    expect(validarResultado({ puntaje: "", resultado: "" })).toEqual({});
    const errores = validarResultado({
      puntaje: "x".repeat(41),
      resultado: "x".repeat(281),
    });
    expect(Object.keys(errores).sort()).toEqual(["puntaje", "resultado"]);
  });

  it("dice quién afirma el resultado", () => {
    expect(etiquetaDeOrigen("declarado")).toBe("Declarado por el postulante");
    expect(etiquetaDeOrigen("verificado")).toBe("Verificado por JobCannon");
  });

  it("no cambia la coincidencia que ve la empresa", () => {
    const busqueda = { habilidades: ["Figma", "SQL"], tagsOcultos: ["UX"] };
    const persona = { habilidades: ["Figma"], tags: ["UX"] };
    const sin = CoincidenciaDeCandidato.entre(busqueda, persona);
    const con = CoincidenciaDeCandidato.entre(busqueda, {
      ...persona,
      tests: [{ test: "aptitudes", puntaje: "Excepcional" }],
    } as typeof persona);
    expect(con).toEqual(sin);
  });
});
