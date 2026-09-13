"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { postularse } from "@/lib/acciones/postulaciones";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Postulación en un paso (RF3.6). El resultado se anuncia en una región
 * `aria-live` para que también llegue a quien navega con lector de pantalla.
 *
 * Con `esEjemplo`, el botón queda deshabilitado y lo dice en su propio texto.
 * `AvisoOrigen` ya avisa arriba de la pantalla que el contenido es de
 * demostración, pero un cartel al principio de una lista larga no alcanza:
 * quien llega a la quinta tarjeta ya no lo tiene a la vista, hace clic y se
 * lleva un error de la base sobre una vacante que no existe.
 */
export function BotonPostularse({
  vacanteId,
  yaPostulado = false,
  esEjemplo = false,
}: {
  vacanteId: string;
  yaPostulado?: boolean;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(postularse, ACCION_INICIAL);

  const listo = yaPostulado || estado.estado === "ok";

  const texto = esEjemplo
    ? "Disponible cuando haya vacantes reales"
    : listo
      ? "Ya te postulaste"
      : enCurso
        ? "Enviando…"
        : "Postularme";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={enviar}>
        <input type="hidden" name="vacanteId" value={vacanteId} />
        <Boton type="submit" disabled={esEjemplo || enCurso || listo}>
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
