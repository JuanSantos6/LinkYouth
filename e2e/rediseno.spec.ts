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

  test("tiene las cuatro columnas", async ({ page }) => {
    await page.goto("/como-funciona");
    const pie = page.getByRole("contentinfo");

    for (const columna of [
      "LinkYouth",
      "Para jóvenes",
      "Para empresas",
      "Ayuda y legales",
    ]) {
      await expect(
        pie.getByRole("navigation", { name: columna, exact: true }),
      ).toBeVisible();
    }
  });
});

test.describe("visitante sin sesión", () => {
  test("ve Entrar y Crear cuenta, sin avisos ni tema, y el logo lleva a la portada", async ({
    page,
  }) => {
    await page.goto("/empleos");
    const cabecera = page.getByRole("banner");
    await expect(cabecera.getByRole("link", { name: "Entrar" })).toBeVisible();
    await expect(
      cabecera.getByRole("link", { name: "Crear cuenta" }),
    ).toBeVisible();
    await expect(cabecera.getByRole("link", { name: "Avisos" })).toHaveCount(0);
    await expect(cabecera.getByRole("button", { name: /^Tema:/ })).toHaveCount(
      0,
    );
    await expect(
      cabecera.getByRole("link", { name: "LinkYouth" }),
    ).toHaveAttribute("href", "/");
  });
});

test.describe("iniciar sesión", () => {
  test("tiene las pestañas Busco trabajo y Soy empresa, con textos propios", async ({
    page,
  }) => {
    await page.goto("/login");
    const pestanas = page.getByRole("navigation", { name: "Tipo de cuenta" });
    await expect(
      pestanas.getByRole("link", { name: "Busco trabajo" }),
    ).toHaveAttribute("aria-current", "page");
    await pestanas.getByRole("link", { name: "Soy empresa" }).click();
    await expect(page).toHaveURL(/tipo=empresa/);
    await expect(page.getByText(/panel de tu organización/)).toBeVisible();
    await expect(page.locator('input[name="tipo_elegido"]')).toHaveValue(
      "empresa",
    );
  });

  test("ofrece mantener la sesión iniciada, sin marcar por defecto", async ({
    page,
  }) => {
    await page.goto("/login");
    const casilla = page.getByRole("checkbox", {
      name: /Mantener la sesión iniciada/,
    });
    await expect(casilla).toBeVisible();
    await expect(casilla).not.toBeChecked();
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

  test("la cinta de organizaciones se mueve sola, sin flechas, y se puede pausar", async ({
    page,
  }) => {
    await page.goto("/");
    const cinta = page.locator(".cinta");
    await expect(
      cinta.getByRole("button", { name: /anteriores|siguientes/ }),
    ).toHaveCount(0);
    await expect(cinta.locator("a")).toHaveCount(0);
    const animacion = await cinta
      .locator(".cinta-pista")
      .evaluate((e) => getComputedStyle(e).animationName);
    expect(animacion).toBe("ly-cinta");
    await cinta.getByRole("button", { name: "Pausar la cinta" }).click();
    await expect(cinta).toHaveAttribute("data-pausada", "true");
  });

  test("la cinta avisa si hay al menos un logo provisorio", async ({
    page,
  }) => {
    // No depende de qué empresas subieron logo en la base: compara el aviso
    // con los logos que la cinta dibujó de verdad.
    await page.goto("/");
    const cinta = page.locator(".cinta");
    const provisorios = await cinta
      .locator(".cinta-ventana [data-logo-provisorio]")
      .count();
    const aviso = cinta.locator("[data-aviso-cinta]");
    await expect(aviso).toBeVisible();
    if (provisorios > 0) {
      await expect(aviso).toHaveAttribute("data-aviso-cinta", "provisorios");
      await expect(aviso).toHaveText(/Logos de ejemplo|logos son provisorios/);
    } else {
      await expect(aviso).toHaveAttribute("data-aviso-cinta", "reales");
    }
  });

  test("las opiniones están marcadas como ejemplo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Opiniones de ejemplo.")).toBeVisible();
    await expect(
      page.getByText("Ejemplo · no es una opinión real"),
    ).toHaveCount(4);
  });
});

test.describe("encabezado progresivo", () => {
  const progreso = (page: import("@playwright/test").Page) =>
    page.evaluate(() =>
      Number(
        getComputedStyle(
          document.querySelector("header.cabecera-flotante")!,
        ).getPropertyValue("--p"),
      ),
    );

  for (const ruta of ["/", "/empleos"]) {
    test(`en ${ruta} avanza desde el primer píxel y se reintegra arriba`, async ({
      page,
    }) => {
      await page.goto(ruta);
      await expect.poll(() => progreso(page)).toBe(0);

      await page.evaluate(() =>
        window.scrollTo({ top: 30, behavior: "instant" }),
      );
      await expect.poll(() => progreso(page)).toBeGreaterThan(0);
      expect(await progreso(page)).toBeLessThan(1);

      await page.evaluate(() =>
        window.scrollTo({ top: 400, behavior: "instant" }),
      );
      await expect.poll(() => progreso(page)).toBe(1);

      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await expect.poll(() => progreso(page)).toBe(0);
    });
  }
});

test.describe("acceso", () => {
  test("la contraseña se puede mostrar y ocultar", async ({ page }) => {
    await page.goto("/login");
    const campo = page.locator('input[name="password"]');
    await expect(campo).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(campo).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña" }).click();
    await expect(campo).toHaveAttribute("type", "password");
  });
});
