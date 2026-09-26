"use client";

import { useEffect, useState } from "react";

import { PreferenciasDeApariencia } from "@/lib/diseno/PreferenciasDeApariencia";
import {
  TEMA_POR_DEFECTO,
  temaSiguiente,
  type Tema,
} from "@/lib/diseno/tokens";

const NOMBRE: Record<Tema, string> = {
  sistema: "como el sistema",
  claro: "claro",
  oscuro: "oscuro",
};

/**
 * Botón visible del encabezado para cambiar el tema: sistema → claro → oscuro.
 *
 * Por defecto la app sigue al sistema. La elección se recuerda en este
 * navegador (`PreferenciasDeApariencia`). El estado real vive en `<html>`,
 * donde ya lo dejó el guion previo al primer pintado: el botón lo lee al
 * montarse, así no dice «claro» mientras la pantalla se ve oscura.
 */
export function BotonTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema>(TEMA_POR_DEFECTO);

  useEffect(() => {
    setTema(PreferenciasDeApariencia.delDocumento().tema);
  }, []);

  const siguiente = temaSiguiente(tema);

  return (
    <button
      type="button"
      onClick={() => {
        PreferenciasDeApariencia.delDocumento().cambiarTema(siguiente);
        setTema(siguiente);
      }}
      aria-label={`Tema: ${NOMBRE[tema]}. Cambiar a ${NOMBRE[siguiente]}`}
      title={`Tema: ${NOMBRE[tema]}`}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-borde-control/70 text-tinta transition-colors duration-150 hover:bg-realce ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
        {tema === "sistema" && (
          <>
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
          </>
        )}
        {tema === "claro" && (
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </g>
        )}
        {tema === "oscuro" && (
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
