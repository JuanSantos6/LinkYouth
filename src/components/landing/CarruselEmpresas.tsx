"use client";

import { useRef } from "react";

import { Avatar } from "@/components/ui/Avatar";
import type { EmpresaResumen } from "@/lib/data/tipos";

/**
 * Las organizaciones que ya publican en LinkYouth.
 *
 * No se mueve solo. Un carrusel que avanza por su cuenta obliga a leer al
 * ritmo de otro y es de lo primero que molesta a quien usa lector de pantalla
 * o tiene activado el movimiento reducido; acá el desplazamiento es siempre
 * una acción de quien mira, con las flechas, el dedo o la rueda.
 *
 * Es `"use client"` por las dos flechas, que necesitan `scrollBy` sobre el
 * contenedor. Sin JavaScript la fila sigue funcionando: se desplaza igual y el
 * anclaje la deja alineada.
 */
export function CarruselEmpresas({ empresas }: { empresas: EmpresaResumen[] }) {
  const pista = useRef<HTMLUListElement>(null);

  function desplazar(direccion: 1 | -1) {
    const contenedor = pista.current;
    if (!contenedor) return;

    contenedor.scrollBy({
      left: direccion * Math.min(contenedor.clientWidth * 0.8, 480),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <div className="relative">
      <ul
        ref={pista}
        tabIndex={0}
        aria-label="Organizaciones que publican en LinkYouth"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 pb-2"
      >
        {empresas.map((empresa) => (
          <li
            key={empresa.id}
            className="w-56 shrink-0 snap-start rounded-ficha border border-borde bg-superficie p-4"
          >
            <Avatar
              nombre={empresa.razon_social}
              url={empresa.logo_url}
              forma="cuadrado"
            />
            <p className="mt-3 text-[15px] font-medium text-tinta">
              {empresa.razon_social}
            </p>
            <p className="mt-0.5 text-[13px] text-apagado">{empresa.rubro}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => desplazar(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-control border border-borde-control text-tinta transition-[color,border-color] duration-150 hover:border-tinta"
        >
          <span aria-hidden="true">←</span>
          <span className="sr-only">Ver las anteriores</span>
        </button>
        <button
          type="button"
          onClick={() => desplazar(1)}
          className="flex h-9 w-9 items-center justify-center rounded-control border border-borde-control text-tinta transition-[color,border-color] duration-150 hover:border-tinta"
        >
          <span aria-hidden="true">→</span>
          <span className="sr-only">Ver las siguientes</span>
        </button>
      </div>
    </div>
  );
}
