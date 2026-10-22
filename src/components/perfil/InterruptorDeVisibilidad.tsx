"use client";

import { useActionState } from "react";

import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { cambiarVisibilidadDePersonalidad } from "@/lib/acciones/personalidad";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * «Mostrar a las empresas a las que me postulo». Un botón con
 * `role="switch"` dentro de un formulario: sin JavaScript también se manda,
 * y manda el valor contrario al actual. El estado se lee en la palabra
 * («Sí» / «No»), no solo en la posición de la perilla.
 */
export function InterruptorDeVisibilidad({
  visible,
  esEjemplo = false,
}: {
  visible: boolean;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    cambiarVisibilidadDePersonalidad,
    ACCION_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-1.5">
      <input type="hidden" name="visible" value={visible ? "no" : "si"} />
      <button
        type="submit"
        role="switch"
        aria-checked={visible}
        disabled={esEjemplo || enCurso}
        className="group flex w-full items-center justify-between gap-4 rounded-ficha border border-borde-control/70 px-4 py-3 text-left transition-colors duration-150 hover:border-tinta disabled:cursor-not-allowed"
      >
        <span>
          <span className="block text-[15px] font-medium text-tinta">
            Mostrar a las empresas a las que me postulo
          </span>
          <span className="block text-[13px] text-apagado">
            {visible
              ? "Lo ven solo las empresas de las búsquedas a las que te postulaste."
              : "Ninguna empresa lo ve."}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-[13.5px] font-semibold text-tinta">
            {visible ? "Sí" : "No"}
          </span>
          <span
            aria-hidden="true"
            className={`relative h-6 w-11 rounded-full border transition-colors duration-200 ${
              visible
                ? "border-acento bg-acento"
                : "border-borde-control bg-realce"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full transition-transform duration-200 ${
                visible
                  ? "translate-x-5 bg-sobre-acento"
                  : "translate-x-0 bg-borde-control"
              }`}
            />
          </span>
        </span>
      </button>
      <MensajeDeAccion estado={estado} />
    </form>
  );
}
