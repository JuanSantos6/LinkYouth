"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { cancelarPostulacion } from "@/lib/acciones/postulaciones";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Cancelar una postulación propia (RF3.8).
 *
 * No borra la fila: la pasa al estado 'cancelada', que es la única transición
 * que la política de RLS le permite al postulante.
 */
export function BotonCancelarPostulacion({
  postulacionId,
}: {
  postulacionId: string;
}) {
  const [estado, enviar, enCurso] = useActionState(
    cancelarPostulacion,
    ACCION_INICIAL,
  );

  if (estado.estado === "ok") {
    return <MensajeDeAccion estado={estado} />;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={enviar}>
        <input type="hidden" name="postulacionId" value={postulacionId} />
        <Boton
          type="submit"
          variante="fantasma"
          disabled={enCurso}
          className="px-2 py-1 text-[13px]"
        >
          {enCurso ? "Cancelando…" : "Cancelar postulación"}
        </Boton>
      </form>

      <MensajeDeAccion estado={estado} className="text-right" />
    </div>
  );
}
