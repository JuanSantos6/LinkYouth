"use client";

import { useState } from "react";

/**
 * Botón de pausa de la cinta de organizaciones (WCAG 2.2.2). Marca
 * `data-pausada` en la cinta y el CSS detiene la animación: no hay
 * JavaScript en cada cuadro. Sin JavaScript no aparece, y la cinta igual se
 * detiene al pasar el mouse o al enfocarla.
 */
export function PausaDeCinta() {
  const [pausada, setPausada] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={pausada}
      onClick={(evento) => {
        const siguiente = !pausada;
        setPausada(siguiente);
        evento.currentTarget
          .closest(".cinta")
          ?.setAttribute("data-pausada", String(siguiente));
      }}
      className="inline-flex items-center gap-2 rounded-full border border-borde-control/70 px-3 py-1.5 text-[13.5px] font-semibold text-tinta transition-colors duration-150 hover:bg-realce motion-reduce:hidden"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
        {pausada ? (
          <path d="M8 5l11 7-11 7z" fill="currentColor" />
        ) : (
          <path
            d="M8 5v14M16 5v14"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        )}
      </svg>
      {pausada ? "Reanudar la cinta" : "Pausar la cinta"}
    </button>
  );
}
