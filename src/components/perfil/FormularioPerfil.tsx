"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { actualizarPerfil } from "@/lib/acciones/perfil";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
import type { PerfilCompleto } from "@/lib/data/tipos";

/**
 * Edición de los datos públicos del perfil (RF1.5 y RF2.2).
 *
 * Solo aparecen los campos que existen en `db/schema.sql`: nombre, apellido,
 * país y biografía. El nombre de usuario y la fecha de nacimiento se muestran
 * sin poder editarse, porque cambiarlos toca reglas que hoy no están
 * resueltas (unicidad del nickname y la restricción de mayoría de edad).
 */
export function FormularioPerfil({ perfil }: { perfil: PerfilCompleto }) {
  const [estado, enviar, enCurso] = useActionState(
    actualizarPerfil,
    ACCION_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            name="nombre"
            defaultValue={perfil.nombre}
            required
            minLength={2}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="Apellido">
          <input
            name="apellido"
            defaultValue={perfil.apellido}
            required
            minLength={2}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="País">
          <input
            name="pais"
            defaultValue={perfil.pais}
            required
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="Nombre de usuario"
          ayuda="Por ahora no se puede cambiar desde acá."
        >
          <input
            value={`@${perfil.nombre_usuario}`}
            readOnly
            disabled
            className={`mt-1.5 ${CAMPO} bg-superficie-suave text-tinta-suave`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Biografía" ayuda="Hasta 600 caracteres.">
        <textarea
          name="bio"
          defaultValue={perfil.bio ?? ""}
          rows={4}
          maxLength={600}
          className={`mt-1.5 resize-y ${CAMPO}`}
        />
      </Campo>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <p
          aria-live="polite"
          className={`text-sm ${
            estado.estado === "error" ? "text-alerta" : "text-exito"
          }`}
        >
          {estado.mensaje}
        </p>
        <Boton type="submit" disabled={enCurso}>
          {enCurso ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}
