"use client";

import { useActionState, useState } from "react";

import { Aceptacion } from "@/components/auth/FormularioRegistro";
import { CampoContrasenia } from "@/components/auth/CampoContrasenia";
import { CampoImagen } from "@/components/auth/CampoImagen";
import { RegistroPendiente } from "@/components/auth/RegistroPendiente";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { registrarEmpresa } from "@/lib/acciones/auth";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/**
 * Registro de una cuenta de empresa (RF1.2).
 *
 * Los campos son las columnas de `empresas` en `db/schema.sql`, más el correo
 * y la contraseña que van a `auth.users`. `descripcion` y `logo_url` son
 * opcionales porque el esquema las declara nullables.
 *
 * El RUT se guarda en dígitos pelados y es único en la tabla: dos empresas no
 * pueden registrar el mismo. El formato se comprueba acá y en la acción; el
 * dígito verificador no se valida y no se consulta a DGI, porque eso es una
 * integración y prometerla sin tenerla sería peor que no validar.
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
    <form action={enviar} className="space-y-5">
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
          maxLength={ReglasDeRegistro.LARGO_NOMBRE}
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="RUT" ayuda="Doce dígitos, con o sin puntos.">
          <input
            name="rut"
            inputMode="numeric"
            spellCheck={false}
            placeholder="21 000 123 0011"
            required
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="Rubro"
          ayuda="Por ejemplo: comercio electrónico, salud."
        >
          <input
            name="rubro"
            required
            minLength={2}
            maxLength={ReglasDeRegistro.LARGO_NOMBRE}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

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

      <CampoImagen
        nombre="logo"
        etiqueta="Logo"
        ayuda="Opcional. JPG, PNG o WebP, hasta 2 MB."
      />

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

      <CampoContrasenia />

      <Aceptacion />

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Creando la cuenta…" : "Crear cuenta de empresa"}
      </Boton>
    </form>
  );
}
