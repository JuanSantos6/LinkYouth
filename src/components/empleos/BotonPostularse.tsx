"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
// TODO: reconectar contra db/schema.sql
import { postularse } from "@/lib/acciones/postulaciones";
// TODO: reconectar contra db/schema.sql
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Postulación en un paso (RF3.6). El resultado se anuncia en una región
 * `aria-live` para que también llegue a quien navega con lector de pantalla.
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
