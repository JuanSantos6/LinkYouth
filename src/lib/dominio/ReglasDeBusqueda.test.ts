import { describe, expect, it } from "vitest";

import { CoincidenciaDeCandidato } from "./CoincidenciaDeCandidato";
import { type DatosDeBusqueda, ReglasDeBusqueda } from "./ReglasDeBusqueda";

const base: DatosDeBusqueda = {
  titulo: "Pasantía en datos",
  descripcion:
    "Vas a sumarte al equipo de datos, con acompañamiento y tiempo para aprender.",
  tipo: "pasantia",
  modalidad: "remota",
  ubicacion: "",
  posiciones: 1,
  habilidades: ["sql"],
  habilidadesOcultas: [],
  tags: [],
  tagsOcultos: [],
};

describe("ReglasDeBusqueda, habilidades públicas y ocultas (RF3.1.6)", () => {
  it("acepta una búsqueda con solo habilidades ocultas", () => {
    const errores = ReglasDeBusqueda.validar({
      ...base,
      habilidades: [],
      habilidadesOcultas: ["sql"],
    });
    expect(errores.habilidades).toBeUndefined();
  });

  it("pide al menos una, contando públicas y ocultas", () => {
    const errores = ReglasDeBusqueda.validar({
      ...base,
      habilidades: [],
      habilidadesOcultas: [],
    });
    expect(errores.habilidades).toMatch(/al menos una/);
  });

  it("el máximo cuenta las dos juntas", () => {
    const diez = Array.from({ length: 6 }, (_, i) => `p${i}`);
    const cinco = Array.from({ length: 5 }, (_, i) => `o${i}`);
    const errores = ReglasDeBusqueda.validar({
      ...base,
      habilidades: diez,
      habilidadesOcultas: cinco,
    });
    expect(errores.habilidades).toMatch(/hasta 10/);
  });

  it("una habilidad no puede ser pública y oculta a la vez", () => {
    const errores = ReglasDeBusqueda.validar({
      ...base,
      habilidades: ["sql"],
      habilidadesOcultas: ["sql"],
    });
    expect(errores.habilidades).toMatch(/pública u oculta/);
  });
});

describe("CoincidenciaDeCandidato.requisitosDe", () => {
  it("las ocultas cuentan como pedidas", () => {
    const requisitos = CoincidenciaDeCandidato.requisitosDe({
      habilidades: [{ nombre: "SQL" }],
      habilidadesOcultas: [{ nombre: "Inglés B2" }],
      tagsOcultos: [{ nombre: "Datos" }],
    });
    expect(requisitos).toEqual({
      habilidades: ["SQL", "Inglés B2"],
      tagsOcultos: ["Datos"],
    });

    const coincidencia = CoincidenciaDeCandidato.entre(requisitos, {
      habilidades: ["inglés b2"],
      tags: ["Datos"],
    });
    expect(coincidencia.habilidadesCubiertas).toBe(1);
    expect(coincidencia.habilidadesPedidas).toBe(2);
    expect(coincidencia.interesesClaveCubiertos).toBe(1);
  });
});
