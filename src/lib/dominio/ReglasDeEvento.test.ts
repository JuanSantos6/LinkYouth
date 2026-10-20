import { describe, expect, it } from "vitest";

import { ReglasDeEvento } from "./ReglasDeEvento";

const conPunto = {
  titulo: "Charla & taller",
  latitud: -34.9055,
  longitud: -56.1913,
  direccion: "Av. 18 de Julio 1234",
};
const soloDireccion = { ...conPunto, latitud: null, longitud: null };

describe("ReglasDeEvento.comoLlegar", () => {
  it("abre Mapas de Apple en el iPhone", () => {
    expect(ReglasDeEvento.comoLlegar(conPunto, "ios")).toBe(
      "https://maps.apple.com/?daddr=-34.9055,-56.1913&q=Charla%20%26%20taller",
    );
  });

  it("deja elegir la app en Android con geo:", () => {
    expect(ReglasDeEvento.comoLlegar(conPunto, "android")).toBe(
      "geo:-34.9055,-56.1913?q=-34.9055,-56.1913(Charla%20%26%20taller)",
    );
  });

  it("usa las indicaciones de OpenStreetMap en la computadora", () => {
    expect(ReglasDeEvento.comoLlegar(conPunto, "otro")).toBe(
      "https://www.openstreetmap.org/directions?to=-34.9055,-56.1913",
    );
  });

  it("sin coordenadas, va a la dirección escrita", () => {
    expect(ReglasDeEvento.comoLlegar(soloDireccion, "android")).toBe(
      "geo:0,0?q=Av.%2018%20de%20Julio%201234",
    );
  });

  it("sin coordenadas ni dirección no hay enlace", () => {
    expect(
      ReglasDeEvento.comoLlegar({ ...soloDireccion, direccion: " " }, "ios"),
    ).toBeNull();
  });
});

describe("ReglasDeEvento.plataformaDe", () => {
  it("reconoce iPhone, Android y el resto", () => {
    expect(
      ReglasDeEvento.plataformaDe(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      ),
    ).toBe("ios");
    expect(
      ReglasDeEvento.plataformaDe("Mozilla/5.0 (Linux; Android 15; Pixel 9)"),
    ).toBe("android");
    expect(ReglasDeEvento.plataformaDe("Mozilla/5.0 (X11; Linux x86_64)")).toBe(
      "otro",
    );
    expect(ReglasDeEvento.plataformaDe(null)).toBe("otro");
  });
});
