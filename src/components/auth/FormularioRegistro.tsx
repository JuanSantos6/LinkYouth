"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { registrarse } from "@/lib/acciones/auth";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Registro de una cuenta individual (RF1.1).
 *
 * Los campos son exactamente las columnas obligatorias de `perfiles` en
 * `db/schema.sql`, más el correo y la contraseña que van a `auth.users`. La
 * mayoría de edad (RF1.1.8) la exige la restricción de la base; acá el campo
 * es un `type="date"` común y el mensaje llega desde la acción.
 */
export function FormularioRegistro() {
  const [estado, enviar, enCurso] = useActionState(registrarse, ACCION_INICIAL);

  return (
    <form action={enviar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            name="nombre"
            autoComplete="given-name"
            required
            minLength={2}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="Apellido">
          <input
            name="apellido"
            autoComplete="family-name"
            required
            minLength={2}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre de usuario"
          ayuda="Así te van a encontrar en la plataforma."
        >
          <input
            name="nombre_usuario"
            autoComplete="username"
            required
            minLength={3}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="País">
          <input
            name="pais"
            autoComplete="country-name"
            defaultValue="Uruguay"
            required
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Fecha de nacimiento"
        ayuda="Tenés que ser mayor de 18 años."
      >
        <input
          type="date"
          name="fecha_nacimiento"
          autoComplete="bday"
          required
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo etiqueta="Correo electrónico">
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo etiqueta="Contraseña" ayuda="Mínimo 6 caracteres.">
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <p
        aria-live="polite"
        className={`text-sm ${
          estado.estado === "error" ? "text-alerta" : "text-exito"
        }`}
      >
        {estado.mensaje}
      </p>

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Creando la cuenta…" : "Crear cuenta"}
      </Boton>
    </form>
  );
}
