"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { guardarContraseniaNueva } from "@/lib/acciones/recuperacion";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

import { CampoContrasenia } from "./CampoContrasenia";

/** RF1.8.4 y RF1.8.5 — Elegir la contraseña nueva y confirmarla. */
export function FormularioContraseniaNueva() {
  const [estado, enviar, enCurso] = useActionState(
    guardarContraseniaNueva,
    ACCION_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-4">
      <CampoContrasenia />

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Guardando…" : "Guardar contraseña"}
      </Boton>
    </form>
  );
}
