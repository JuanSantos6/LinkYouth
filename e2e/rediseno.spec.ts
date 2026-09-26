import { expect, test } from "@playwright/test";

/**
 * Sistema «Recreo» (2026-09-27): lo que el rediseño promete y se puede
 * comprobar sin escribir en la base.
 */

test.describe("pie de página", () => {
  test("ningún enlace del pie lleva a una página vacía", async ({
    page,
    request,
  }) => {
    await page.goto("/como-funciona");
    const hrefs = await page
      .getByRole("contentinfo")
      .locator("a[href^='/']")
      .evaluateAll((enlaces) => [
        ...new Set(enlaces.map((a) => a.getAttribute("href")!)),
      ]);

    expect(hrefs.length).toBeGreaterThanOrEqual(12);
    for (const href of hrefs) {
      const respuesta = await request.get(href.split("#")[0]);
      expect(respuesta.status(), href).toBe(200);
    }
  });

  test("tiene las cuatro columnas y la de redes", async ({ page }) => {
    await page.goto("/como-funciona");
    const pie = page.getByRole("contentinfo");

    for (const columna of [
      "LinkYouth",
      "Para jóvenes",
      "Para empresas",
      "Ayuda y legales",
      "Redes",
    ]) {
      await expect(
        pie
          .getByRole("navigation", { name: columna })
          .or(pie.getByRole("list", { name: columna })),
      ).toBeVisible();
    }
  });
});

test.describe("tema", () => {
  test("el botón del encabezado cambia el tema y lo recuerda", async ({
    page,
  }) => {
    await page.goto("/como-funciona");
    const raiz = page.locator("html");
    await expect(raiz).not.toHaveAttribute("data-tema", /.+/);

    const boton = page.getByRole("button", { name: /^Tema:/ });
    await boton.click();
    await expect(raiz).toHaveAttribute("data-tema", "claro");
    await boton.click();
    await expect(raiz).toHaveAttribute("data-tema", "oscuro");

    await page.reload();
    await expect(raiz).toHaveAttribute("data-tema", "oscuro");
  });
});

test.describe("portada", () => {
  test("las tres tarjetas de «Así funciona» miden lo mismo", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const tarjetas = page.locator("[data-parallax-tarjeta]");
    await expect(tarjetas).toHaveCount(3);

    const alturas = await tarjetas.evaluateAll((lista) =>
      lista.map((t) => Math.round(t.getBoundingClientRect().height)),
    );
    expect(new Set(alturas).size).toBe(1);
  });

  test("«Ver más» expande una tarjeta y «Ver menos» la cierra", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const boton = page.getByRole("button", { name: "Ver más" }).first();
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    await boton.click();
    const menos = page.getByRole("button", { name: "Ver menos" }).first();
    await expect(menos).toHaveAttribute("aria-expanded", "true");
    await menos.click();
    await expect(
      page.getByRole("button", { name: "Ver más" }).first(),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("el slider de bienvenida se puede pausar", async ({ page }) => {
    await page.goto("/");
    const pausa = page.getByRole("button", {
      name: "Pausar el cambio automático",
    });
    await pausa.click();
    await expect(
      page.getByRole("button", { name: "Reanudar el cambio automático" }),
    ).toBeVisible();
  });

  test("las opiniones están marcadas como ejemplo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Opiniones de ejemplo.")).toBeVisible();
    await expect(
      page.getByText("Ejemplo · no es una opinión real"),
    ).toHaveCount(4);
  });
});
