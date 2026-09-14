"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { iniciarSesion } from "@/lib/acciones/auth";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/** Inicio de sesión (RF1.3). */
export function FormularioLogin() {
  const [estado, enviar, enCurso] = useActionState(
    iniciarSesion,
    ACCION_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-4">
      <Campo etiqueta="Correo electrónico">
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo etiqueta="Contraseña">
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Entrando…" : "Entrar"}
      </Boton>
    </form>
  );
}
