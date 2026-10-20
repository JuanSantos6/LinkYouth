"use client";

import { useActionState, useState } from "react";

import { EntradaContrasenia } from "@/components/auth/EntradaContrasenia";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { eliminarCuenta } from "@/lib/acciones/cuenta";
import {
  type EstadoFormulario,
  FORMULARIO_INICIAL,
} from "@/lib/acciones/tipos";
import type { TipoCuenta } from "@/lib/data/tipos";

/**
 * RF1.7 — Eliminar la cuenta definitivamente, confirmando la contraseña y la
 * palabra ELIMINAR.
 */
export function FormularioEliminarCuenta({
  tipo = "individual",
}: {
  tipo?: TipoCuenta;
}) {
  const [estadoAccion, enviar, enCurso] = useActionState(
    eliminarCuenta,
    FORMULARIO_INICIAL,
  );
  const estado: EstadoFormulario = estadoAccion;
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const errorConfirmacion =
    error.confirmacion ??
    (estado.estado === "error" &&
    !error.actual &&
    estado.mensaje.includes("ELIMINAR")
      ? estado.mensaje
      : undefined);

  const estadoConCampos: EstadoFormulario = errorConfirmacion
    ? {
        ...estado,
        campos: { ...error, confirmacion: errorConfirmacion },
      }
    : estado;

  const [ultimoEstado, setUltimoEstado] = useState(estadoAccion);
  const [envios, setEnvios] = useState(0);
  if (estadoAccion !== ultimoEstado) {
    setUltimoEstado(estadoAccion);
    setEnvios((n) => n + 1);
  }

  return (
    <form action={enviar} className="space-y-4">
      <EnfocarPrimerError estado={estadoConCampos} />

      <div className="space-y-2 rounded-ficha border border-borde-control/70 bg-realce p-4 text-[14px] leading-relaxed text-tinta">
        <p className="font-semibold">
          Qué pasa cuando eliminás la cuenta (no se puede deshacer):
        </p>
        {tipo === "empresa" ? (
          <ul className="list-disc space-y-1 pl-5 text-apagado">
            <li>
              Se borran el perfil de la empresa, su logo, las inscripciones y
              los avisos.
            </li>
            <li>
              Se cierran sus búsquedas activas y se cancelan sus eventos
              futuros.
            </li>
            <li>Las postulaciones y las reseñas quedan sin nombre asociado.</li>
          </ul>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-apagado">
            <li>
              Se borran tu perfil, tus intereses, tus habilidades, tu formación,
              tus inscripciones y tus avisos.
            </li>
            <li>Las postulaciones en curso se cancelan.</li>
            <li>Las reseñas que hayas escrito quedan sin nombre.</li>
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Campo etiqueta="Contraseña actual">
            <EntradaContrasenia
              key={`actual-${envios}`}
              name="actual"
              autoComplete="current-password"
              required
              aria-invalid={error.actual ? true : undefined}
              aria-describedby={error.actual ? "error-actual" : undefined}
            />
          </Campo>
          {error.actual && (
            <p
              id="error-actual"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.actual}
            </p>
          )}
        </div>

        <div>
          <Campo
            etiqueta="Escribí ELIMINAR para confirmar"
            ayuda={
              errorConfirmacion
                ? undefined
                : "En mayúsculas, tal como aparece acá."
            }
          >
            <input
              name="confirmacion"
              defaultValue={valor.texto("confirmacion", "")}
              autoComplete="off"
              spellCheck={false}
              required
              aria-invalid={errorConfirmacion ? true : undefined}
              aria-describedby={
                errorConfirmacion ? "error-confirmacion" : undefined
              }
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {errorConfirmacion && (
            <p
              id="error-confirmacion"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {errorConfirmacion}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MensajeDeAccion estado={estado} className="max-w-md" />
        <Boton type="submit" variante="secundario" disabled={enCurso}>
          {enCurso ? "Eliminando cuenta…" : "Eliminar la cuenta"}
        </Boton>
      </div>
    </form>
  );
}
