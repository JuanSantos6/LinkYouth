import Link from "next/link";

type Variante = "horizontal" | "apilado" | "isotipo";

/** Proporción ancho / alto de cada archivo de `public/marca/`. */
const PROPORCION: Record<Variante, number> = {
  horizontal: 651.37 / 145.28,
  apilado: 280.4 / 301.24,
  isotipo: 1,
};

/**
 * Logo oficial de LinkYouth (versión 3).
 *
 * Los SVG de `public/marca/` son una reconstrucción de la lámina del logo:
 * ver `docs/decisiones.md`, 2026-09-27. «Link» lleva el degradado del
 * isotipo y «Youth» va en negro, o en blanco sobre fondo oscuro: por eso hay
 * dos archivos, y el CSS muestra el que corresponde al tema (`.logo-claro`,
 * `.logo-oscuro` en `globals.css`). Son imágenes y no SVG en línea para que el
 * logo pueda aparecer dos veces en la misma página —cabecera y pie— sin
 * repetir los ids de sus degradados.
 *
 * El destino es obligatorio: sin sesión, la portada; con sesión,
 * `inicioDe(area)` de `src/lib/navegacion.ts`.
 */
export function Marca({
  href,
  variante = "horizontal",
  alto = 28,
}: {
  href: string;
  variante?: Variante;
  alto?: number;
}) {
  const ancho = Math.round(alto * PROPORCION[variante]);
  const archivo = variante === "isotipo" ? "isotipo" : `logo-${variante}`;
  const oscuro = variante === "isotipo" ? "isotipo" : `logo-${variante}-oscuro`;

  return (
    <Link href={href} className="flex shrink-0 items-center rounded-control">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, no necesita el optimizador */}
      <img
        src={`/marca/${archivo}.svg`}
        alt="LinkYouth"
        width={ancho}
        height={alto}
        className="logo-claro"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- ídem */}
      <img
        src={`/marca/${oscuro}.svg`}
        alt="LinkYouth"
        width={ancho}
        height={alto}
        className="logo-oscuro"
      />
    </Link>
  );
}
