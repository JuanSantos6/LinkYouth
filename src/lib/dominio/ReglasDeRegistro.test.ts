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

describe("ReglasDeRegistro.formatoReal", () => {
  const con = (...bytes: number[]) =>
    new File(
      [new Uint8Array([...bytes, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])],
      "x",
    );

  it("reconoce JPG, PNG y WebP por sus primeros bytes", async () => {
    expect(await ReglasDeRegistro.formatoReal(con(0xff, 0xd8, 0xff))).toBe(
      "image/jpeg",
    );
    expect(
      await ReglasDeRegistro.formatoReal(
        con(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
      ),
    ).toBe("image/png");
    const webp = new File([new TextEncoder().encode("RIFF\0\0\0\0WEBP")], "x");
    expect(await ReglasDeRegistro.formatoReal(webp)).toBe("image/webp");
  });

  it("no se deja engañar por el tipo declarado: un HTML que dice ser PNG no pasa", async () => {
    const html = new File(["<html><script>alert(1)</script></html>"], "x.png", {
      type: "image/png",
    });
    expect(ReglasDeRegistro.problemaDeImagen(html)).toBeNull();
    expect(await ReglasDeRegistro.formatoReal(html)).toBeNull();
  });

  it("un GIF o un SVG tampoco", async () => {
    expect(
      await ReglasDeRegistro.formatoReal(new File(["GIF89a......"], "x.gif")),
    ).toBeNull();
    expect(
      await ReglasDeRegistro.formatoReal(new File(["<svg></svg>"], "x.svg")),
    ).toBeNull();
  });
});
