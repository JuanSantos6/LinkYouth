"use client";

import { useActionState, useState } from "react";

import { CampoContrasenia } from "@/components/auth/CampoContrasenia";
import { EntradaContrasenia } from "@/components/auth/EntradaContrasenia";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { cambiarContrasenia } from "@/lib/acciones/cuenta";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";

/**
 * RF1.5.2 — Cambiar la contraseña, confirmando primero la actual.
 */
export function FormularioContrasenia() {
  const [estado, enviar, enCurso] = useActionState(
    cambiarContrasenia,
    FORMULARIO_INICIAL,
  );
  const error = estado.campos ?? {};

  const [ultimoEstado, setUltimoEstado] = useState(estado);
  const [envios, setEnvios] = useState(0);
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    setEnvios((n) => n + 1);
  }

  return (
    <form action={enviar} className="space-y-4">
      <EnfocarPrimerError estado={estado} />

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

      <CampoContrasenia
        key={`nueva-${envios}`}
        errorContrasenia={error.password}
        errorConfirmacion={error.password_confirmacion}
      />

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MensajeDeAccion estado={estado} className="max-w-md" />
        <Boton type="submit" variante="secundario" disabled={enCurso}>
          {enCurso ? "Guardando…" : "Cambiar contraseña"}
        </Boton>
      </div>
    </form>
  );
}
