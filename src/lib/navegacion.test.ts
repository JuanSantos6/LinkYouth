import { describe, expect, it } from "vitest";

import { correspondeA, inicioDe } from "./navegacion";

describe("correspondeA", () => {
  it("con sesión la portada no es destino de nadie: se va al panel", () => {
    expect(correspondeA("empresa", "/")).toBe(false);
    expect(correspondeA("postulante", "/")).toBe(false);
    expect(correspondeA("postulante", "/?x=1#arriba")).toBe(false);
  });

  it("«Cómo funciona» no es para la empresa con sesión", () => {
    expect(correspondeA("empresa", "/como-funciona")).toBe(false);
    expect(correspondeA("postulante", "/como-funciona")).toBe(true);
  });

  it("cada cuenta se queda en su mitad", () => {
    expect(correspondeA("empresa", "/empresa/busquedas")).toBe(true);
    expect(correspondeA("empresa", "/empleos")).toBe(false);
    expect(correspondeA("postulante", "/empresa")).toBe(false);
    expect(correspondeA("postulante", "/empleos/abc")).toBe(true);
  });
});

describe("inicioDe", () => {
  it("lleva a cada cuenta a su panel y al público a la portada", () => {
    expect(inicioDe("empresa")).toBe("/empresa");
    expect(inicioDe("postulante")).toBe("/inicio");
    expect(inicioDe("publico")).toBe("/");
  });
});
