import { describe, expect, it } from "vitest";

import { TipoDeAviso } from "./TipoDeAviso";

describe("TipoDeAviso", () => {
  it("nombra los estados con palabras", () => {
    expect(new TipoDeAviso("postulacion_seleccionada").etiqueta).toBe(
      "Te seleccionaron",
    );
    expect(new TipoDeAviso("postulacion_descartada").tono).toBe("baja");
  });

  it("lee un tipo desconocido como aviso genérico", () => {
    expect(new TipoDeAviso("otra_cosa").etiqueta).toBe("Aviso");
  });

  it("acota el contador de la campana", () => {
    expect(TipoDeAviso.textoDelContador(0)).toBeNull();
    expect(TipoDeAviso.textoDelContador(3)).toBe("3");
    expect(TipoDeAviso.textoDelContador(12)).toBe("9+");
    expect(TipoDeAviso.nombreDeLaCampana(12)).toBe("Avisos, 12 sin leer");
  });
});
