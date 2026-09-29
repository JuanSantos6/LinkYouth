"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fila que se desliza con flechas. Es `scroll-snap` nativo: sin JavaScript
 * se desliza con el dedo, la rueda o el teclado (la fila es enfocable), y las
 * flechas aparecen recién cuando hay JavaScript para moverla.
 */
export function Carrusel({
  etiqueta,
  children,
  claro = false,
  controlesArriba,
  className = "",
}: {
  etiqueta: string;
  children: React.ReactNode;
  /** Flechas claras, para usar sobre una foto oscura. */
  claro?: boolean;
  /** Dónde van las flechas: un contenedor aparte, o arriba de la fila. */
  controlesArriba?: React.ReactNode;
  className?: string;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const [limites, setLimites] = useState({
    inicio: true,
    fin: false,
    listo: false,
  });

  useEffect(() => {
    const elemento = pista.current;
    if (!elemento) return;
    const medir = () =>
      setLimites({
        inicio: elemento.scrollLeft <= 4,
        fin:
          elemento.scrollLeft >=
          elemento.scrollWidth - elemento.clientWidth - 4,
        listo: true,
      });
    medir();
    elemento.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      elemento.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  const mover = (direccion: 1 | -1) => {
    const elemento = pista.current;
    const tarjeta = elemento?.firstElementChild as HTMLElement | null;
    if (!elemento || !tarjeta) return;
    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    elemento.scrollBy({
      left: direccion * (tarjeta.offsetWidth + 16),
      behavior: reducido ? "auto" : "smooth",
    });
  };

  const boton = `flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] transition-[background-color,opacity] duration-150 disabled:cursor-default disabled:opacity-35 ${
    claro
      ? "border-white/75 bg-white/10 text-white hover:bg-white/25"
      : "border-borde-control bg-superficie text-tinta hover:bg-realce"
  }`;

  return (
    <div
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        {controlesArriba}
        {limites.listo && (
          <div className="flex gap-2">
            <button
              type="button"
              className={boton}
              onClick={() => mover(-1)}
              disabled={limites.inicio}
              aria-label={`${etiqueta}: anteriores`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={boton}
              onClick={() => mover(1)}
              disabled={limites.fin}
              aria-label={`${etiqueta}: siguientes`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div
        ref={pista}
        tabIndex={0}
        role="region"
        aria-label={etiqueta}
        className="sin-barra flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 motion-safe:scroll-smooth"
      >
        {children}
      </div>
    </div>
  );
}
