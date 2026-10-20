"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { cambiarNombreDeUsuario } from "@/lib/acciones/cuenta";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/**
 * RF1.5.1 — Cambiar el nombre de usuario (solo cuentas de joven).
 */
export function FormularioNombreDeUsuario({
  actual = "",
}: {
  actual?: string;
}) {
  const [estado, enviar, enCurso] = useActionState(
    cambiarNombreDeUsuario,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const min = ReglasDeRegistro.LARGO_USUARIO_MINIMO;
  const max = ReglasDeRegistro.LARGO_USUARIO_MAXIMO;

  return (
    <form action={enviar} className="space-y-4">
      <EnfocarPrimerError estado={estado} />

      <div>
        <Campo
          etiqueta="Nombre de usuario"
          ayuda={
            error.nombre_usuario
              ? undefined
              : `Entre ${min} y ${max} caracteres, sin espacios ni «@».`
          }
        >
          <input
            name="nombre_usuario"
            defaultValue={valor.texto("nombre_usuario", actual)}
            autoComplete="username"
            spellCheck={false}
            required
            minLength={min}
            maxLength={max}
            aria-invalid={error.nombre_usuario ? true : undefined}
            aria-describedby={
              error.nombre_usuario ? "error-nombre_usuario" : undefined
            }
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
        {error.nombre_usuario && (
          <p
            id="error-nombre_usuario"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.nombre_usuario}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MensajeDeAccion estado={estado} className="max-w-md" />
        <Boton type="submit" variante="secundario" disabled={enCurso}>
          {enCurso ? "Guardando…" : "Guardar nombre de usuario"}
        </Boton>
      </div>
    </form>
  );
}
