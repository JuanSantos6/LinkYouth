"use client";

import { useRef, useState } from "react";

/**
 * Un `<details>` que se despliega y se pliega con transición, con los mismos
 * tiempos que el resto de la app (200 ms al abrir, 150 ms al cerrar).
 *
 * Sin JavaScript es un `<details>` común: abre y cierra igual, sin
 * animación. Con JavaScript se intercepta el clic del `<summary>`: al abrir
 * se marca `open` y en el cuadro siguiente crece la grilla; al cerrar,
 * primero se achica y recién después se quita `open`.
 */
export function DetallesSuaves({
  resumen,
  children,
  abiertoAlInicio = false,
  className = "",
}: {
  resumen: React.ReactNode;
  children: React.ReactNode;
  abiertoAlInicio?: boolean;
  className?: string;
}) {
  const detalles = useRef<HTMLDetailsElement>(null);
  const [desplegado, setDesplegado] = useState(abiertoAlInicio);

  return (
    <details
      ref={detalles}
      open={abiertoAlInicio}
      className={`group ${className}`}
    >
      <summary
        onClick={(evento) => {
          evento.preventDefault();
          const elemento = detalles.current;
          if (!elemento) return;

          if (!desplegado) {
            elemento.open = true;
            requestAnimationFrame(() => setDesplegado(true));
          } else {
            setDesplegado(false);
            const reducido = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            window.setTimeout(
              () => (elemento.open = false),
              reducido ? 0 : 160,
            );
          }
        }}
        className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-titulo text-[18px] font-bold text-tinta [&::-webkit-details-marker]:hidden"
      >
        {resumen}
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-borde-control/70 text-[20px] leading-none transition-transform duration-200 ${
            desplegado ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </summary>
      <div className="plegable" data-abierto={desplegado}>
        <div>{children}</div>
      </div>
    </details>
  );
}
