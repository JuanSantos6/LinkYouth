"use client";

import { useActionState, useState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { publicarResenia } from "@/lib/acciones/resenias";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import { ReglasDeResenia } from "@/lib/dominio/ReglasDeResenia";

const ESTRELLAS = [1, 2, 3, 4, 5] as const;

/**
 * RF8.1 — Formulario para publicar una reseña anónima de una empresa en la que
 * la persona se postuló.
 */
export function FormularioDeResenia({ empresaId }: { empresaId: string }) {
  const [estado, enviar, enCurso] = useActionState(
    publicarResenia,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const R = ReglasDeResenia;

  const [ultimoEstado, setUltimoEstado] = useState(estado);
  const [calificacion, setCalificacion] = useState(
    () => Number(valor.texto("calificacion", "0")) || 0,
  );
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    const devuelta = Number(valor.texto("calificacion", "0")) || 0;
    setCalificacion(estado.estado === "ok" ? 0 : devuelta);
  }

  return (
    <form action={enviar} className="space-y-4">
      <EnfocarPrimerError estado={estado} />
      <input type="hidden" name="empresaId" value={empresaId} />

      <fieldset>
        <legend className="text-[14px] font-medium text-tinta">
          Calificación
        </legend>

        <div
          role="radiogroup"
          aria-label="Calificación"
          aria-invalid={error.calificacion ? true : undefined}
          aria-describedby={
            error.calificacion ? "error-calificacion" : undefined
          }
          className="mt-1.5 flex flex-wrap items-center gap-1"
        >
          {ESTRELLAS.map((n) => {
            const activa = n <= calificacion;
            return (
              <label
                key={n}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-control transition-colors duration-150 hover:bg-realce has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-acento"
              >
                <input
                  type="radio"
                  name="calificacion"
                  value={n}
                  checked={calificacion === n}
                  onChange={() => setCalificacion(n)}
                  className="sr-only"
                />
                <span className="sr-only">
                  {n === 1 ? "1 estrella" : `${n} estrellas`}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="1.75"
                  className={`h-6 w-6 transition-colors duration-150 ${
                    activa
                      ? "fill-violeta stroke-violeta"
                      : "fill-transparent stroke-borde-control"
                  }`}
                >
                  <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
                </svg>
              </label>
            );
          })}

          <span className="ml-2 text-[13px] text-apagado">
            {calificacion > 0
              ? `${calificacion} de 5`
              : "Elegí de 1 a 5 estrellas"}
          </span>
        </div>

        {error.calificacion && (
          <p
            id="error-calificacion"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.calificacion}
          </p>
        )}
      </fieldset>

      <div>
        <Campo
          etiqueta="Tu experiencia"
          ayuda={
            error.comentario
              ? undefined
              : `Entre ${R.COMENTARIO_MIN} y ${R.COMENTARIO_MAX} caracteres. Se publica sin tu nombre.`
          }
        >
          <textarea
            name="comentario"
            defaultValue={valor.texto("comentario", "")}
            required
            rows={4}
            minLength={R.COMENTARIO_MIN}
            maxLength={R.COMENTARIO_MAX}
            aria-invalid={error.comentario ? true : undefined}
            aria-describedby={error.comentario ? "error-comentario" : undefined}
            className={`mt-1.5 resize-y ${CAMPO}`}
          />
        </Campo>
        {error.comentario && (
          <p
            id="error-comentario"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.comentario}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MensajeDeAccion estado={estado} className="max-w-md" />
        <Boton type="submit" variante="secundario" disabled={enCurso}>
          {enCurso ? "Publicando…" : "Publicar reseña"}
        </Boton>
      </div>
    </form>
  );
}
