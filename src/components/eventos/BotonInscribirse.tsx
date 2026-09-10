"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
// TODO: reconectar contra db/schema.sql
import { inscribirse } from "@/lib/acciones/eventos";
// TODO: reconectar contra db/schema.sql
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/** Inscripción a un evento institucional (RF4.5). */
export function BotonInscribirse({ eventoId }: { eventoId: string }) {
  const [estado, enviar, enCurso] = useActionState(inscribirse, ACCION_INICIAL);

  const listo = estado.estado === "ok";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={enviar}>
        <input type="hidden" name="eventoId" value={eventoId} />
        <Boton type="submit" variante="secundario" disabled={enCurso || listo}>
          {listo ? "Inscripto" : enCurso ? "Confirmando…" : "Inscribirme"}
        </Boton>
      </form>

      <p
        aria-live="polite"
        className={`max-w-xs text-right text-xs ${
          estado.estado === "error" ? "text-alerta" : "text-tinta-suave"
        }`}
      >
        {estado.mensaje}
      </p>
    </div>
  );
}
