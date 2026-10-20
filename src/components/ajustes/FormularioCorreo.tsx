"use client";

import { useActionState, useState } from "react";

import { EntradaContrasenia } from "@/components/auth/EntradaContrasenia";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { cambiarCorreo } from "@/lib/acciones/cuenta";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";

/**
 * RF1.5.3 — Cambiar el correo electrónico, confirmando la contraseña actual.
 */
export function FormularioCorreo({
  correoActual,
}: {
  correoActual?: string | null;
}) {
  const [estado, enviar, enCurso] = useActionState(
    cambiarCorreo,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
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

      <p className="text-[14px] text-apagado">
        Correo actual:{" "}
        <span className="font-semibold text-tinta">
          {correoActual ?? "Sin sesión activa"}
        </span>
      </p>

      <div>
        <Campo
          etiqueta="Correo nuevo"
          ayuda={
            error.email
              ? undefined
              : "Te mandamos un enlace a esa dirección para confirmar el cambio."
          }
        >
          <input
            type="email"
            name="email"
            defaultValue={valor.texto("email", "")}
            autoComplete="email"
            spellCheck={false}
            required
            aria-invalid={error.email ? true : undefined}
            aria-describedby={error.email ? "error-email" : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
        {error.email && (
          <p
            id="error-email"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.email}
          </p>
        )}
      </div>

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

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MensajeDeAccion estado={estado} className="max-w-md" />
        <Boton type="submit" variante="secundario" disabled={enCurso}>
          {enCurso ? "Enviando enlace…" : "Cambiar correo"}
        </Boton>
      </div>
    </form>
  );
}
