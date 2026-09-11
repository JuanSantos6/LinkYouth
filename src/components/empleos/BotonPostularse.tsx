"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { postularse } from "@/lib/acciones/postulaciones";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Postulación en un paso (RF3.6).
 *
 * El botón y su confirmación usan la misma palabra: «Postularme» →
 * «Postulación enviada». Si el botón dijera una cosa y el aviso otra, habría
 * que releer para saber si pasó lo que se pidió.
 */
export function BotonPostularse({
  vacanteId,
  yaPostulado = false,
}: {
  vacanteId: string;
  yaPostulado?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(postularse, ACCION_INICIAL);

  const listo = yaPostulado || estado.estado === "ok";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={enviar}>
        <input type="hidden" name="vacanteId" value={vacanteId} />
        <Boton type="submit" disabled={enCurso || listo}>
          {listo ? "Ya te postulaste" : enCurso ? "Enviando…" : "Postularme"}
        </Boton>
      </form>

      <MensajeDeAccion estado={estado} className="text-right" />
    </div>
  );
}
