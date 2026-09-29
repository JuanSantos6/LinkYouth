"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { iniciarSesion } from "@/lib/acciones/auth";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
import { PARAMETRO_SIGUIENTE } from "@/lib/navegacion";

import { EntradaContrasenia } from "./EntradaContrasenia";

/**
 * Inicio de sesión (RF1.3).
 *
 * `siguiente` es la pantalla a la que se vuelve después de entrar. Viaja como
 * campo oculto porque la acción de servidor no ve la URL de la página; la
 * valida `iniciarSesion`, no este componente.
 */
export function FormularioLogin({
  siguiente,
  tipo = "individual",
}: {
  siguiente?: string | null;
  /** La pestaña elegida. Solo sirve para avisar si no coincide con la cuenta. */
  tipo?: "individual" | "empresa";
}) {
  const [estado, enviar, enCurso] = useActionState(
    iniciarSesion,
    ACCION_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-4">
      {siguiente && (
        <input type="hidden" name={PARAMETRO_SIGUIENTE} value={siguiente} />
      )}
      <input type="hidden" name="tipo_elegido" value={tipo} />

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
        <EntradaContrasenia
          name="password"
          autoComplete="current-password"
          required
        />
      </Campo>

      <label className="flex cursor-pointer items-start gap-2.5 text-[15px] text-tinta">
        <input
          type="checkbox"
          name="recordar"
          value="1"
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[var(--ly-violeta-texto)]"
          aria-describedby="ayuda-recordar"
        />
        <span>
          Mantener la sesión iniciada
          <span id="ayuda-recordar" className="block text-[13px] text-apagado">
            Si no la marcás, la sesión se cierra al cerrar el navegador.
          </span>
        </span>
      </label>

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Entrando…" : "Entrar"}
      </Boton>
    </form>
  );
}
