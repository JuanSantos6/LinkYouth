"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
// TODO: reconectar contra db/schema.sql
import { actualizarPerfil } from "@/lib/acciones/perfil";
// TODO: reconectar contra db/schema.sql
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
// TODO: reconectar contra db/schema.sql
import type { PerfilCompleto } from "@/lib/data/tipos";

const CAMPO =
  "w-full rounded-control border border-borde bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-tenue focus:border-primario focus:outline-none";

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
      <span className="text-sm font-medium text-tinta">{etiqueta}</span>
      {children}
      {ayuda && (
        <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>
      )}
    </label>
  );
}

/** Edición de los datos públicos del perfil (RF1.5 y RF2.2). */
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
            maxLength={60}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="Apellido">
          <input
            name="apellido"
            defaultValue={perfil.apellido}
            required
            minLength={2}
            maxLength={60}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Titular"
        ayuda="Una línea sobre qué estudiás o qué buscás. Es lo primero que lee una empresa."
      >
        <input
          name="titular"
          defaultValue={perfil.titular ?? ""}
          maxLength={120}
          placeholder="Estudiante de Ingeniería en Computación · Front-end junior"
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Ciudad">
          <input
            name="ciudad"
            defaultValue={perfil.ciudad ?? ""}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="País">
          <input
            name="pais"
            defaultValue={perfil.pais}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Biografía" ayuda="Hasta 600 caracteres.">
        <textarea
          name="biografia"
          defaultValue={perfil.biografia ?? ""}
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
