"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { ACCION_INICIAL, type EstadoAccion } from "@/lib/acciones/tipos";

/** Los cuatro textos que puede mostrar el botón, uno por estado. */
type Textos = {
  /** En reposo: «Postularme», «Inscribirme». */
  inicial: string;
  /** Mientras la acción viaja: «Enviando…», «Inscribiendo…». */
  enCurso: string;
  /** Ya hecho, antes o recién: «Ya te postulaste». */
  hecho: string;
  /** El ítem es de demostración: no hay nada sobre lo que accionar. */
  ejemplo: string;
};

/**
 * Botón que dispara una acción de servidor sobre un ítem y anuncia el
 * resultado.
 *
 * Sale de fusionar `BotonPostularse` y `BotonInscribirse`, que eran el mismo
 * componente con tres textos cambiados. Mantenerlos separados significaba que
 * cada arreglo había que hacerlo dos veces y acordarse de las dos.
 *
 * Vive en `ui/` y no en una carpeta de dominio porque no sabe nada de vacantes
 * ni de eventos: recibe la acción, el nombre del campo y su valor.
 *
 * El botón y su confirmación usan la misma palabra —«Postularme» →
 * «Postulación enviada»—: si dijeran cosas distintas habría que releer para
 * saber si pasó lo que se pidió.
 */
export function BotonAccion({
  accion,
  campo,
  valor,
  textos,
  variante = "primario",
  hecho = false,
  esEjemplo = false,
}: {
  accion: (
    estadoPrevio: EstadoAccion,
    datos: FormData,
  ) => Promise<EstadoAccion>;
  /** Nombre del campo oculto que la acción lee del `FormData`. */
  campo: string;
  valor: string;
  textos: Textos;
  variante?: "primario" | "secundario" | "fantasma";
  /** La acción ya se hizo antes de montar el botón. */
  hecho?: boolean;
  /** El ítem salió de `ejemplos.ts`: no hay nada sobre lo que accionar. */
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(accion, ACCION_INICIAL);

  const listo = hecho || estado.estado === "ok";

  const texto = esEjemplo
    ? textos.ejemplo
    : listo
      ? textos.hecho
      : enCurso
        ? textos.enCurso
        : textos.inicial;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <form action={enviar}>
        <input type="hidden" name={campo} value={valor} />
        <Boton
          type="submit"
          variante={variante}
          disabled={esEjemplo || enCurso || listo}
        >
          {texto}
        </Boton>
      </form>

      <MensajeDeAccion estado={estado} className="max-w-xs sm:text-right" />
    </div>
  );
}
