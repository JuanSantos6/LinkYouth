import { describe, expect, it } from "vitest";

import { COLORES_DE_AVATAR, colorDeAvatar } from "./avatar";

describe("colorDeAvatar", () => {
  it("da siempre el mismo color para la misma cuenta", () => {
    const id = "6f1c2a9e-1b7d-4c55-9a1e-2f0c8d3b4a51";
    expect(colorDeAvatar(id)).toBe(colorDeAvatar(id));
  });

  it("reparte las cuentas entre todos los colores", () => {
    const usados = new Set(
      Array.from({ length: 200 }, (_, i) => colorDeAvatar(`cuenta-${i}`)),
    );
    expect(usados.size).toBe(COLORES_DE_AVATAR.length);
  });
});
