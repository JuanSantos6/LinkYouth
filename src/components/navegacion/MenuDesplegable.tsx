"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Menú que se abre desde un botón: el de perfil y el de secciones en el
 * teléfono.
 *
 * Se abre y se cierra con fundido y 6 px de desplazamiento (`.emergente` en
 * `globals.css`: 200 ms al abrir, 150 ms al cerrar). Se cierra con Esc, con un
 * clic afuera o al elegir una opción, y el foco vuelve al botón. Las flechas
 * recorren las opciones. Con «reducir movimiento», todo instantáneo.
 */
export function MenuDesplegable({
  boton,
  etiqueta,
  alinear = "derecha",
  children,
}: {
  /** Contenido visible del botón. */
  boton: React.ReactNode;
  /** Nombre accesible del botón y del menú. */
  etiqueta: string;
  alinear?: "derecha" | "izquierda";
  /** Opciones: elementos con `role="menuitem"`. */
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton_ = useRef<HTMLButtonElement>(null);
  const id = useId();

  const opciones = () =>
    Array.from(
      raiz.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );

  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) boton_.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;
    opciones()[0]?.focus();

    const alHacerClic = (evento: MouseEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener("click", alHacerClic);
    return () => document.removeEventListener("click", alHacerClic);
  }, [abierto]);

  return (
    <div
      ref={raiz}
      className="relative"
      onKeyDown={(evento) => {
        if (!abierto) return;
        if (evento.key === "Escape") {
          evento.preventDefault();
          cerrar(true);
        }
        if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
          evento.preventDefault();
          const lista = opciones();
          const actual = lista.indexOf(document.activeElement as HTMLElement);
          const paso = evento.key === "ArrowDown" ? 1 : -1;
          lista[(actual + paso + lista.length) % lista.length]?.focus();
        }
      }}
    >
      <button
        ref={boton_}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={etiqueta}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-borde-control/70 px-1.5 text-tinta transition-colors duration-150 hover:bg-realce"
      >
        {boton}
      </button>

      <div
        id={id}
        role="menu"
        aria-label={etiqueta}
        data-abierto={abierto}
        onClick={(evento) => {
          if ((evento.target as HTMLElement).closest('[role="menuitem"]'))
            cerrar(false);
        }}
        className={`emergente absolute top-[calc(100%+10px)] z-50 grid min-w-56 gap-0.5 rounded-ficha border border-borde bg-superficie p-1.5 shadow-flotante ${
          alinear === "derecha"
            ? "right-0 origin-top-right"
            : "left-0 origin-top-left"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/** Clase de cada opción del menú. */
export const OPCION_MENU =
  "flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[15px] text-tinta transition-colors duration-150 hover:bg-realce focus-visible:bg-realce";
