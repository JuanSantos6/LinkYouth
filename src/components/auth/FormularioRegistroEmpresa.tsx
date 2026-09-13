"use client";

import { useActionState, useState } from "react";

import { RegistroPendiente } from "@/components/auth/RegistroPendiente";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { registrarEmpresa } from "@/lib/acciones/auth";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Registro de una cuenta de empresa (RF1.2).
 *
 * Los campos son las columnas de `empresas` en `db/schema.sql`, más el correo y
 * la contraseña que van a `auth.users`. `descripcion` y `logo_url` son opcionales
 * porque el esquema las declara nullables.
 *
 * El logo se pide como URL y no como archivo: la subida a Supabase Storage
 * entra en el Hito 2, junto con la foto de perfil. Pedirlo como archivo hoy
 * sería prometer algo que no guarda nada.
 */
export function FormularioRegistroEmpresa() {
  const [estado, enviar, enCurso] = useActionState(
    registrarEmpresa,
    ACCION_INICIAL,
  );

  // Mismo motivo que en `FormularioRegistro`: la acción no devuelve el correo
  // y el formulario ya se limpió cuando vuelve `ok`.
  const [email, setEmail] = useState("");

  if (estado.estado === "ok") {
    return <RegistroPendiente email={email} mensaje={estado.mensaje} />;
  }

  return (
    <form action={enviar} className="space-y-4">
      <Campo
        etiqueta="Razón social"
        ayuda="El nombre legal con el que la empresa aparece en la plataforma."
      >
        <input
          name="razon_social"
          autoComplete="organization"
          spellCheck={false}
          required
          minLength={2}
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo etiqueta="Rubro" ayuda="Por ejemplo: comercio electrónico, salud.">
        <input
          name="rubro"
          required
          minLength={2}
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo
        etiqueta="Descripción"
        ayuda="Opcional. A qué se dedica la empresa, en pocas líneas."
      >
        <textarea
          name="descripcion"
          rows={3}
          maxLength={600}
          className={`mt-1.5 resize-y ${CAMPO}`}
        />
      </Campo>

      <Campo
        etiqueta="Logo"
        ayuda="Opcional. Por ahora se pega una dirección web; la subida de archivos llega con el módulo de almacenamiento."
      >
        <input
          type="url"
          name="logo_url"
          inputMode="url"
          spellCheck={false}
          placeholder="https://…"
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo etiqueta="Correo electrónico">
        <input
          type="email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          required
          onChange={(evento) => setEmail(evento.target.value)}
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

      <p aria-live="polite" className="text-sm text-alerta">
        {estado.mensaje}
      </p>

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Creando la cuenta…" : "Crear cuenta de empresa"}
      </Boton>
    </form>
  );
}
