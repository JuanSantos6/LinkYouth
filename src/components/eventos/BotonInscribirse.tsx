"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { inscribirse } from "@/lib/acciones/eventos";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/** Inscripción a un evento institucional (RF4.5). */
export function BotonInscribirse({
  eventoId,
  yaInscripto = false,
}: {
  eventoId: string;
  yaInscripto?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(inscribirse, ACCION_INICIAL);

  const listo = yaInscripto || estado.estado === "ok";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={enviar}>
        <input type="hidden" name="eventoId" value={eventoId} />
        <Boton type="submit" variante="secundario" disabled={enCurso || listo}>
          {listo
            ? "Ya te inscribiste"
            : enCurso
              ? "Inscribiendo…"
              : "Inscribirme"}
        </Boton>
      </form>

      <MensajeDeAccion estado={estado} className="text-right" />
    </div>
  );
}
