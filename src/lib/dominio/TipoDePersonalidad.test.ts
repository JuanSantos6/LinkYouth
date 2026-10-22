import { describe, expect, it } from "vitest";

import { CoincidenciaDeCandidato } from "./CoincidenciaDeCandidato";
import { TipoDePersonalidad } from "./TipoDePersonalidad";

const todos = TipoDePersonalidad.opciones().flatMap((g) => g.tipos);

describe("TipoDePersonalidad", () => {
  it("ofrece los 16 tipos, sin repetir, en cuatro grupos de cuatro", () => {
    expect(todos).toHaveLength(16);
    expect(new Set(todos.map((t) => t.letras)).size).toBe(16);
    expect(
      TipoDePersonalidad.opciones().map((g) => [g.titulo, g.tipos.length]),
    ).toEqual([
      ["Analistas", 4],
      ["Diplomáticos", 4],
      ["Centinelas", 4],
      ["Exploradores", 4],
    ]);
  });

  it("agrupa por letras: NT, NF, SJ y SP", () => {
    for (const { letras } of todos) {
      const tipo = TipoDePersonalidad.armar(letras, "A")!;
      const esperado = letras.includes("N")
        ? letras.includes("T")
          ? "analistas"
          : "diplomaticos"
        : letras.endsWith("J")
          ? "centinelas"
          : "exploradores";
      expect(tipo.grupo, letras).toBe(esperado);
    }
  });

  it("lee un código guardado y deriva el nombre", () => {
    const tipo = TipoDePersonalidad.de("INTJ-T")!;
    expect(tipo.nombre).toBe("Arquitecto");
    expect(tipo.codigo).toBe("INTJ-T");
    expect(tipo.nombreDelGrupo).toBe("Analistas");
    expect(tipo.nombreDeLaVariante).toBe("Turbulenta");
    expect(TipoDePersonalidad.de("ENFP-A")!.nombre).toBe("Activista");
  });

  it("rechaza lo que la base también rechaza", () => {
    for (const codigo of ["INTJ", "intj-a", "XNTJ-A", "INTJ-X", "", null]) {
      expect(TipoDePersonalidad.de(codigo), String(codigo)).toBeNull();
    }
    expect(TipoDePersonalidad.armar("INTJ", "B")).toBeNull();
    expect(TipoDePersonalidad.armar("ABCD", "A")).toBeNull();
  });

  it("los 32 códigos cumplen el `check` de la migración 009", () => {
    const check = /^[EI][SN][TF][JP]-[AT]$/;
    for (const { letras } of todos) {
      for (const v of ["A", "T"]) {
        expect(TipoDePersonalidad.armar(letras, v)!.codigo).toMatch(check);
      }
    }
  });

  it("no cambia la coincidencia que ve la empresa", () => {
    const busqueda = { habilidades: ["Figma", "SQL"], tagsOcultos: ["UX"] };
    const persona = { habilidades: ["Figma"], tags: ["UX"] };
    const sin = CoincidenciaDeCandidato.entre(busqueda, persona);
    const con = CoincidenciaDeCandidato.entre(busqueda, {
      ...persona,
      personalidad: "INTJ-A",
    } as typeof persona);
    expect(con).toEqual(sin);
  });
});
