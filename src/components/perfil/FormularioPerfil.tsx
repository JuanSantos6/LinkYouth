"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { actualizarPerfil } from "@/lib/acciones/perfil";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
import type { PerfilCompleto } from "@/lib/data/tipos";

const CAMPO =
  "mt-1.5 w-full rounded-control border border-borde-control bg-superficie px-3 py-2 text-[14px] text-tinta placeholder:text-apagado focus:border-acento focus:outline-none";

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-tinta">{etiqueta}</span>
      {children}
      {ayuda && (
        <span className="mt-1 block text-[13px] text-apagado">{ayuda}</span>
      )}
    </label>
  );
}

/**
 * Edición de los datos públicos del perfil (RF1.5 y RF2.2).
 *
 * Solo aparecen los campos que existen en `db/schema.sql`: nombre, apellido,
 * país y biografía. El nombre de usuario se muestra sin poder editarse, porque
 * cambiarlo toca una regla de unicidad que hoy no está resuelta.
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
            className={CAMPO}
          />
        </Campo>

        <Campo etiqueta="Apellido">
          <input
            name="apellido"
            defaultValue={perfil.apellido}
            required
            minLength={2}
            className={CAMPO}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="País">
          <input
            name="pais"
            defaultValue={perfil.pais}
            required
            className={CAMPO}
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
            className={`${CAMPO} bg-realce text-apagado`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Biografía" ayuda="Hasta 600 caracteres.">
        <textarea
          name="bio"
          defaultValue={perfil.bio ?? ""}
          rows={4}
          maxLength={600}
          className={`${CAMPO} resize-y`}
        />
      </Campo>

      <div className="flex flex-wrap items-center justify-end gap-4">
        <MensajeDeAccion estado={estado} />
        <Boton type="submit" disabled={enCurso}>
          {enCurso ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}
