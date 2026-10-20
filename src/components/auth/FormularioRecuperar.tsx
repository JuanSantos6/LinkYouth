"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { pedirRecuperacion } from "@/lib/acciones/recuperacion";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/** RF1.8.1 — Pedir el enlace para elegir una contraseña nueva. */
export function FormularioRecuperar() {
  const [estado, enviar, enCurso] = useActionState(
    pedirRecuperacion,
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

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Enviando…" : "Mandame el enlace"}
      </Boton>
    </form>
  );
}
