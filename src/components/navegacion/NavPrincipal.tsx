"use client";

import { usePathname } from "next/navigation";

import { EnlaceTransicion } from "./Transiciones";

export type Seccion = { href: string; etiqueta: string };

/**
 * Las secciones del encabezado. La activa se marca con peso y con un filete
 * violeta debajo, además de `aria-current`: el color nunca va solo.
 */
export function NavPrincipal({ secciones }: { secciones: readonly Seccion[] }) {
  const ruta = usePathname();

  // La sección activa es la de dirección más larga que contiene a la ruta:
  // en `/empresa/busquedas` coinciden «Panel» (`/empresa`) y «Mis búsquedas»,
  // y marcar las dos diría que se está en dos lugares a la vez.
  const baseActiva = secciones
    .filter(({ href }) => !href.includes("#"))
    .map(({ href }) => href)
    .filter((base) => ruta === base || ruta.startsWith(`${base}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav
      aria-label="Secciones de LinkYouth"
      className="hidden min-w-0 flex-1 md:block"
    >
      <ul className="flex items-center gap-1">
        {secciones.map(({ href, etiqueta }) => {
          const base = href.split("#")[0];
          const activa = !href.includes("#") && base === baseActiva;

          // Anclas de la misma página (la portada): un `<a>` común, que desplaza
          // suave con Lenis o con `scroll-behavior`, y deja la marca en el historial.
          if (href.startsWith("#")) {
            return (
              <li key={href}>
                <a
                  href={href}
                  className="block whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-medium text-tinta transition-colors duration-150 hover:bg-realce"
                >
                  {etiqueta}
                </a>
              </li>
            );
          }

          return (
            <li key={href}>
              <EnlaceTransicion
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`relative block whitespace-nowrap rounded-full px-3 py-2 text-[15px] transition-colors duration-150 hover:bg-realce ${
                  activa
                    ? "font-bold text-tinta after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-violeta"
                    : "font-medium text-tinta"
                }`}
              >
                {etiqueta}
              </EnlaceTransicion>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
