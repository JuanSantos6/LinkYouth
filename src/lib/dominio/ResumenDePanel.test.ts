import { describe, expect, it } from "vitest";

import type {
  EstadoPostulacion,
  PanelDeEmpresa,
  Recomendado,
} from "@/lib/data/tipos";

import { ResumenDePanel } from "./ResumenDePanel";

function recomendado(
  id: string,
  estado: EstadoPostulacion,
  creada_en: string,
  conPersona = true,
): Recomendado {
  return {
    postulacion: {
      id,
      estado,
      creada_en,
      actualizada_en: creada_en,
      persona: conPersona
        ? {
            id: `p-${id}`,
            nombre_usuario: `u${id}`,
            nombre: "Ana",
            apellido: id,
            pais: "Uruguay",
            bio: null,
            foto_url: null,
          }
        : null,
      habilidades: [],
      tags: [],
      formaciones: [],
    },
    busqueda: {
      id: "b1",
      titulo: "Pasantía",
      habilidades: [],
      habilidadesOcultas: [],
      tagsOcultos: [],
    },
  };
}

const panel = (recomendados: Recomendado[]): PanelDeEmpresa => ({
  empresa: {
    id: "e1",
    razon_social: "Empresa",
    rut: null,
    rubro: "Tecnología",
    descripcion: null,
    logo_url: null,
    sitio_web: null,
  },
  busquedas: [],
  eventos: [],
  recomendados,
});

describe("ResumenDePanel.nuevosParaRevisar", () => {
  it("lista solo las nuevas, de la más reciente a la más vieja", () => {
    const resumen = new ResumenDePanel(
      panel([
        recomendado("a", "pendiente", "2026-10-20T10:00:00Z"),
        recomendado("b", "en_revision", "2026-10-22T10:00:00Z"),
        recomendado("c", "pendiente", "2026-10-21T10:00:00Z"),
        recomendado("d", "pendiente", "2026-10-22T09:00:00Z", false),
      ]),
    );
    expect(
      resumen.nuevosParaRevisar().map(({ postulacion }) => postulacion.id),
    ).toEqual(["c", "a"]);
  });

  it("respeta el límite", () => {
    const resumen = new ResumenDePanel(
      panel(
        Array.from({ length: 8 }, (_, i) =>
          recomendado(`${i}`, "pendiente", `2026-10-1${i}T10:00:00Z`),
        ),
      ),
    );
    expect(resumen.nuevosParaRevisar()).toHaveLength(5);
    expect(resumen.nuevosParaRevisar(2)).toHaveLength(2);
  });
});
