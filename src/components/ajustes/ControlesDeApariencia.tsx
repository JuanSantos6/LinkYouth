"use client";

import { useEffect, useState } from "react";

import { PreferenciasDeApariencia } from "@/lib/diseno/PreferenciasDeApariencia";
import { TEMAS, TEMA_POR_DEFECTO, type Tema } from "@/lib/diseno/tokens";

const OPCIONES: Record<Tema, { etiqueta: string; ayuda: string }> = {
  sistema: {
    etiqueta: "Como el sistema",
    ayuda: "Sigue la configuración de tu teléfono o computadora.",
  },
  claro: { etiqueta: "Claro", ayuda: "Fondo claro siempre." },
  oscuro: { etiqueta: "Oscuro", ayuda: "Fondo oscuro siempre." },
};

/**
 * Elección de tema. Es la misma preferencia que cambia el botón del
 * encabezado: los dos leen y escriben `PreferenciasDeApariencia`.
 *
 * El selector de color de la plataforma se sacó con el sistema «Recreo»: la
 * paleta nace del logo y es una sola (ver `docs/decisiones.md`, 2026-09-27).
 */
export function ControlesDeApariencia() {
  const [tema, setTema] = useState<Tema>(TEMA_POR_DEFECTO);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setTema(PreferenciasDeApariencia.delDocumento().tema);
    setListo(true);
  }, []);

  return (
    <fieldset>
      <legend className="text-[17px] font-semibold text-tinta">Tema</legend>
      <p className="mt-1 max-w-md text-[14px] text-apagado">
        Cómo se ve LinkYouth en este navegador. También lo podés cambiar con el
        botón del encabezado.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {TEMAS.map((opcion) => {
          const elegido = opcion === tema;

          return (
            <label
              key={opcion}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-ficha border px-4 py-3 transition-colors duration-150 ${
                elegido
                  ? "border-acento bg-lavanda"
                  : "border-borde-control/70 hover:border-tinta"
              }`}
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold text-tinta">
                <input
                  type="radio"
                  name="tema"
                  value={opcion}
                  checked={elegido}
                  disabled={!listo}
                  onChange={() => {
                    PreferenciasDeApariencia.delDocumento().cambiarTema(opcion);
                    setTema(opcion);
                  }}
                  className="accent-[var(--ly-violeta-texto)]"
                />
                {OPCIONES[opcion].etiqueta}
              </span>
              <span className="pl-6 text-[13px] text-apagado">
                {OPCIONES[opcion].ayuda}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
