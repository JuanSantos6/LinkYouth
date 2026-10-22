import { describe, expect, it } from "vitest";

import type { EstadoPostulacion } from "@/lib/data/tipos";

import { agruparPorEstado } from "./EstadoParaEmpresa";

type Item = { id: string; estado: EstadoPostulacion };
const de = (item: Item) => item.estado;

describe("agruparPorEstado", () => {
  it("devuelve los cinco estados en orden, con los vacíos", () => {
    const grupos = agruparPorEstado<Item>(
      [
        { id: "a", estado: "entrevista" },
        { id: "b", estado: "pendiente" },
        { id: "c", estado: "pendiente" },
      ],
      de,
    );
    expect(grupos.map((g) => [g.etiqueta, g.items.length])).toEqual([
      ["Nueva", 2],
      ["En revisión", 0],
      ["Entrevista", 1],
      ["Seleccionada", 0],
      ["Descartada", 0],
    ]);
  });

  it("respeta el orden de entrada dentro de cada grupo", () => {
    const grupos = agruparPorEstado<Item>(
      [
        { id: "x", estado: "pendiente" },
        { id: "y", estado: "pendiente" },
      ],
      de,
    );
    expect(grupos[0].items.map((i) => i.id)).toEqual(["x", "y"]);
  });

  it("«Se retiró» va al final y solo si hay alguien", () => {
    expect(agruparPorEstado<Item>([], de)).toHaveLength(5);
    const grupos = agruparPorEstado<Item>(
      [{ id: "z", estado: "cancelada" }],
      de,
    );
    expect(grupos.at(-1)).toMatchObject({
      estado: "cancelada",
      etiqueta: "Se retiró",
    });
  });
});
