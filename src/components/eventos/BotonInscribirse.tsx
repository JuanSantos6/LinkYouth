"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { inscribirse } from "@/lib/acciones/eventos";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Inscripción a un evento institucional (RF4.5).
 *
 * Con `esEjemplo`, el botón queda deshabilitado y lo dice en su propio texto.
 * Mismo motivo que en `BotonPostularse`: el cartel de `AvisoOrigen` está arriba
 * de la lista y deja de verse al scrollear.
 */
export function BotonInscribirse({
  eventoId,
  yaInscripto = false,
  esEjemplo = false,
}: {
  eventoId: string;
  yaInscripto?: boolean;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(inscribirse, ACCION_INICIAL);

  const listo = yaInscripto || estado.estado === "ok";

  const texto = esEjemplo
    ? "Disponible cuando haya eventos reales"
    : listo
      ? "Inscripto"
      : enCurso
        ? "Confirmando…"
        : "Inscribirme";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={enviar}>
        <input type="hidden" name="eventoId" value={eventoId} />
        <Boton
          type="submit"
          variante="secundario"
          disabled={esEjemplo || enCurso || listo}
        >
          {texto}
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
