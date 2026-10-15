"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type OpcionDeFiltro = {
  href: string;
  etiqueta: string;
  activa: boolean;
};

/**
 * Filtros y pestañas con una marca que se desliza de la opción anterior a la
 * nueva, en vez de aparecer de golpe: el ojo sigue el cambio.
 *
 * Siguen siendo enlaces con `searchParams` (CLAUDE.md: filtros y pestañas se
 * hacen con enlaces): sin JavaScript funcionan igual, con la activa marcada
 * por su fondo. La marca solo usa `transform` y `width`.
 */
export function FiltroDeslizante({
  opciones,
  etiqueta,
}: {
  opciones: readonly OpcionDeFiltro[];
  etiqueta: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [marca, setMarca] = useState<{ x: number; ancho: number } | null>(null);

  useLayoutEffect(() => {
    const activa = contenedor.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!activa) return setMarca(null);
    const medir = () =>
      setMarca({ x: activa.offsetLeft, ancho: activa.offsetWidth });
    medir();
    document.fonts?.ready.then(medir).catch(() => {});
  }, [opciones]);

  return (
    <div
      ref={contenedor}
      role="group"
      aria-label={etiqueta}
      className="relative inline-flex rounded-full border border-borde-control/70 bg-superficie p-1"
    >
      {marca && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-0 rounded-full bg-tinta transition-[transform,width] duration-200 ease-out"
          style={{ width: marca.ancho, transform: `translateX(${marca.x}px)` }}
        />
      )}
      {opciones.map(({ href, etiqueta: texto, activa }) => (
        <Link
          key={href}
          href={href}
          aria-current={activa ? "page" : undefined}
          className={`relative z-10 rounded-full px-4 py-1.5 text-[14px] whitespace-nowrap transition-colors duration-200 ${
            activa
              ? `font-bold text-papel ${marca ? "" : "bg-tinta"}`
              : "font-medium text-tinta hover:bg-realce"
          }`}
        >
          {texto}
        </Link>
      ))}
    </div>
  );
}
