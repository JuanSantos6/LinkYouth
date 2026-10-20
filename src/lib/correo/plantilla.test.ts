import { describe, expect, it } from "vitest";

import { armarCorreo, enlaceAbsoluto, esDireccionDePrueba } from "./plantilla";

const URL_PUBLICA = "https://linkyouth.example.net";

describe("enlaceAbsoluto", () => {
  it("completa una ruta interna con la dirección pública", () => {
    expect(enlaceAbsoluto("/postulaciones#postulacion-1", URL_PUBLICA)).toBe(
      "https://linkyouth.example.net/postulaciones#postulacion-1",
    );
  });

  it("no pone en un correo nada que no sea una ruta propia", () => {
    expect(enlaceAbsoluto("https://otro.sitio/x", URL_PUBLICA)).toBeNull();
    expect(enlaceAbsoluto("//otro.sitio/x", URL_PUBLICA)).toBeNull();
    expect(enlaceAbsoluto(null, URL_PUBLICA)).toBeNull();
  });
});

describe("esDireccionDePrueba", () => {
  it("reconoce los dominios reservados de la demo y los e2e", () => {
    expect(esDireccionDePrueba("lucia.fernandez@example.com")).toBe(true);
    expect(esDireccionDePrueba("e2e@linkyouth.invalid")).toBe(true);
    expect(esDireccionDePrueba("contacto@linkyouth.example")).toBe(true);
    expect(esDireccionDePrueba("alguien@gmail.com")).toBe(false);
  });
});

describe("armarCorreo", () => {
  it("escapa el texto del aviso en el HTML", () => {
    const correo = armarCorreo(
      {
        asunto: "Te seleccionaron para «<b>Pasantía</b>»",
        mensaje: "Te seleccionaron en A & B para «<b>Pasantía</b>».",
        enlace: "/postulaciones#postulacion-1",
      },
      URL_PUBLICA,
    );
    expect(correo.html).not.toContain("<b>Pasantía</b>");
    expect(correo.html).toContain("A &amp; B");
    expect(correo.html).toContain(
      'href="https://linkyouth.example.net/postulaciones#postulacion-1"',
    );
    expect(correo.texto).toContain(
      "Ver en LinkYouth: https://linkyouth.example.net/postulaciones#postulacion-1",
    );
  });
});
