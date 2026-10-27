"use client";

import { useActionState, useState } from "react";

import { Aceptacion } from "@/components/auth/FormularioRegistro";
import { CampoContrasenia } from "@/components/auth/CampoContrasenia";
import { CampoImagen } from "@/components/auth/CampoImagen";
import { RegistroPendiente } from "@/components/auth/RegistroPendiente";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { registrarEmpresa } from "@/lib/acciones/auth";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
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
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};

  const [ultimoEstado, setUltimoEstado] = useState(estado);
  const [envios, setEnvios] = useState(0);
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    setEnvios((n) => n + 1);
  }

  // Mismo motivo que en `FormularioRegistro`: cuando vuelve `ok`, el formulario
  // se reemplaza por el aviso de confirmación.
  const [email, setEmail] = useState("");

  if (estado.estado === "ok") {
    return (
      <RegistroPendiente
        email={email || valor.texto("email", "")}
        mensaje={estado.mensaje}
      />
    );
  }

  return (
    <form action={enviar} className="space-y-5">
      <EnfocarPrimerError estado={estado} />

      <div>
        <Campo
          etiqueta="Razón social"
          ayuda={
            error.razon_social
              ? undefined
              : "El nombre legal con el que la empresa aparece en la plataforma."
          }
        >
          <input
            name="razon_social"
            defaultValue={valor.texto("razon_social", "")}
            autoComplete="organization"
            spellCheck={false}
            required
            minLength={2}
            maxLength={ReglasDeRegistro.LARGO_NOMBRE}
            aria-invalid={error.razon_social ? true : undefined}
            aria-describedby={
              error.razon_social ? "error-razon_social" : undefined
            }
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
        {error.razon_social && (
          <p
            id="error-razon_social"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.razon_social}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Campo
            etiqueta="RUT"
            ayuda={error.rut ? undefined : "Doce dígitos, con o sin puntos."}
          >
            <input
              name="rut"
              defaultValue={valor.texto("rut", "")}
              inputMode="numeric"
              spellCheck={false}
              placeholder="21 000 123 0011"
              required
              aria-invalid={error.rut ? true : undefined}
              aria-describedby={error.rut ? "error-rut" : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.rut && (
            <p
              id="error-rut"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.rut}
            </p>
          )}
        </div>

        <div>
          <Campo
            etiqueta="Rubro"
            ayuda={
              error.rubro
                ? undefined
                : "Por ejemplo: comercio electrónico, salud."
            }
          >
            <input
              name="rubro"
              defaultValue={valor.texto("rubro", "")}
              required
              minLength={2}
              maxLength={ReglasDeRegistro.LARGO_NOMBRE}
              aria-invalid={error.rubro ? true : undefined}
              aria-describedby={error.rubro ? "error-rubro" : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.rubro && (
            <p
              id="error-rubro"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.rubro}
            </p>
          )}
        </div>
      </div>

      <div>
        <Campo
          etiqueta="Descripción"
          ayuda={
            error.descripcion
              ? undefined
              : "Opcional. A qué se dedica la empresa, en pocas líneas."
          }
        >
          <textarea
            name="descripcion"
            defaultValue={valor.texto("descripcion", "")}
            rows={3}
            maxLength={600}
            aria-invalid={error.descripcion ? true : undefined}
            aria-describedby={
              error.descripcion ? "error-descripcion" : undefined
            }
            className={`mt-1.5 resize-y ${CAMPO}`}
          />
        </Campo>
        {error.descripcion && (
          <p
            id="error-descripcion"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.descripcion}
          </p>
        )}
      </div>

      <CampoImagen
        nombre="logo"
        etiqueta="Logo"
        ayuda="Opcional. JPG, PNG o WebP, hasta 5 MB."
        estado={estado}
        error={error.logo}
      />

      <div>
        <Campo etiqueta="Correo electrónico">
          <input
            type="email"
            name="email"
            defaultValue={valor.texto("email", "")}
            autoComplete="email"
            spellCheck={false}
            required
            onChange={(evento) => setEmail(evento.target.value)}
            aria-invalid={error.email ? true : undefined}
            aria-describedby={error.email ? "error-email" : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
        {error.email && (
          <p
            id="error-email"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.email}
          </p>
        )}
      </div>

      <CampoContrasenia
        key={`contrasenia-${envios}`}
        errorContrasenia={error.password}
        errorConfirmacion={error.password_confirmacion}
      />

      <Aceptacion
        key={`aceptacion-${envios}`}
        porDefecto={valor.texto("privacidad", "") === "si"}
        error={error.privacidad}
      />

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Creando la cuenta…" : "Crear cuenta de empresa"}
      </Boton>
    </form>
  );
}
