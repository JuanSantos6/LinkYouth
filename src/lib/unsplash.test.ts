import { describe, expect, it } from "vitest";

import {
  conReferencia,
  creditoDe,
  esDeUnsplash,
  urlConTamanio,
} from "./unsplash";

const RAW =
  "https://images.unsplash.com/photo-1500000000000-abc?ixid=M3wx&ixlib=rb-4.0.3";

describe("unsplash", () => {
  it("reconoce solo images.unsplash.com", () => {
    expect(esDeUnsplash(RAW)).toBe(true);
    expect(esDeUnsplash("https://images.unsplash.com.otro.sitio/x")).toBe(
      false,
    );
    expect(esDeUnsplash("/storage/v1/object/public/avatars/x.webp")).toBe(
      false,
    );
    expect(esDeUnsplash(null)).toBe(false);
  });

  it("pide el tamaño con los parámetros de imgix y conserva los de la API", () => {
    const url = new URL(
      urlConTamanio(RAW, 640, { encuadre: "caras", alto: 640 }),
    );
    expect(url.origin).toBe("https://images.unsplash.com");
    expect(url.searchParams.get("ixid")).toBe("M3wx");
    expect(url.searchParams.get("w")).toBe("640");
    expect(url.searchParams.get("h")).toBe("640");
    expect(url.searchParams.get("crop")).toBe("faces");
    expect(url.searchParams.get("fm")).toBe("webp");
  });

  it("los enlaces de atribución llevan utm_source y utm_medium=referral", () => {
    const enlace = new URL(conReferencia("https://unsplash.com/@ana"));
    expect(enlace.searchParams.get("utm_source")).toBe("linkyouth");
    expect(enlace.searchParams.get("utm_medium")).toBe("referral");

    const credito = creditoDe({
      autor: "Ana Pérez",
      autor_enlace: "https://unsplash.com/@ana",
    });
    expect(credito.autor).toBe("Ana Pérez");
    expect(credito.unsplashEnlace).toContain("utm_medium=referral");
  });
});
