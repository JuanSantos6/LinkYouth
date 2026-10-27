import { describe, expect, it } from "vitest";

import { ReglasDeRegistro } from "./ReglasDeRegistro";

const MB = 1024 * 1024;

function imagen(tipo: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], "foto", { type: tipo });
}

describe("ReglasDeRegistro.problemaDeImagen", () => {
  it("acepta JPG, PNG y WebP hasta 5 MB", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      expect(
        ReglasDeRegistro.problemaDeImagen(imagen(tipo, 5 * MB)),
      ).toBeNull();
    }
  });

  it("una foto de celular de 3 MB pasa (el tope era 2 MB)", () => {
    expect(
      ReglasDeRegistro.problemaDeImagen(imagen("image/jpeg", 3 * MB)),
    ).toBeNull();
  });

  it("rechaza lo que pesa más de 5 MB, diciendo cuánto es el máximo", () => {
    expect(
      ReglasDeRegistro.problemaDeImagen(imagen("image/png", 5 * MB + 1)),
    ).toBe("La imagen supera los 5 MB.");
  });

  it("rechaza lo que no es JPG, PNG o WebP", () => {
    for (const tipo of ["image/gif", "image/svg+xml", "text/html", ""]) {
      expect(ReglasDeRegistro.problemaDeImagen(imagen(tipo, 10))).toBe(
        "La imagen tiene que ser JPG, PNG o WebP.",
      );
    }
  });

  it("un campo de archivo vacío no es un problema: es que no se eligió nada", () => {
    expect(
      ReglasDeRegistro.problemaDeImagen(new File([], "", { type: "" })),
    ).toBeNull();
  });
});
