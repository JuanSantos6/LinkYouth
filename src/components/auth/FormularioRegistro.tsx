"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { CampoContrasenia } from "@/components/auth/CampoContrasenia";
import { CampoImagen } from "@/components/auth/CampoImagen";
import { RegistroPendiente } from "@/components/auth/RegistroPendiente";
import { SelectorIntereses } from "@/components/auth/SelectorIntereses";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { registrarse } from "@/lib/acciones/auth";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import { PARAMETRO_SIGUIENTE } from "@/lib/navegacion";
import type { OpcionCatalogo } from "@/lib/data/tipos";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/**
 * Registro de una cuenta individual (RF1.1).
 *
 * Los campos son las columnas obligatorias de `perfiles` en `db/schema.sql`,
 * más el correo y la contraseña que van a `auth.users`, más los intereses que
 * van a `perfil_tags`.
 *
 * Todo lo que valida acá lo vuelve a validar `registrarse()`, y la mayoría de
 * edad la decide en última instancia el `check` `perfiles_mayor_de_edad`. Este
 * formulario no es una barrera: es la comodidad de enterarse antes de mandar.
 *
 * Lo que **no** hace es preguntar si el correo ya existe. Un formulario que
 * responde «ese correo ya está registrado» antes de mandar es un buscador de
 * cuentas: cualquiera podría averiguar quién está en la plataforma probando
 * direcciones. Esa respuesta la da Supabase, que trata todos los correos igual.
 */
export function FormularioRegistro({
  intereses,
  interesesDeEjemplo = false,
  fechaMaximaDeNacimiento,
  siguiente,
}: {
  /** Catálogo de `tags` para elegir las áreas de interés (RF1.1.11). */
  intereses: OpcionCatalogo[];
  /** El catálogo salió de `ejemplos.ts`: sus ids no existen en la base. */
  interesesDeEjemplo?: boolean;
  /**
   * La fecha más reciente que admite el campo de nacimiento. Llega calculada
   * desde el servidor y no se saca del reloj del navegador: son dos relojes
   * distintos, y calcularla en los dos lados sería una diferencia de
   * hidratación esperando a pasar.
   */
  fechaMaximaDeNacimiento: string;
  /** Pantalla a la que se vuelve con la cuenta creada. La valida la acción. */
  siguiente?: string | null;
}) {
  const [estado, enviar, enCurso] = useActionState(
    registrarse,
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

  // El correo se guarda al tipearlo porque, cuando vuelve `ok`, el formulario
  // se reemplaza por el aviso de confirmación.
  const [email, setEmail] = useState("");

  // `ok` en este formulario solo puede significar una cosa: el `signUp` anduvo
  // pero no dejó sesión, porque falta confirmar el correo. Con sesión, la
  // acción redirige y nunca llega a devolver.
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
      {siguiente && (
        <input type="hidden" name={PARAMETRO_SIGUIENTE} value={siguiente} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Campo etiqueta="Nombre">
            <input
              name="nombre"
              defaultValue={valor.texto("nombre", "")}
              autoComplete="given-name"
              required
              minLength={2}
              maxLength={ReglasDeRegistro.LARGO_NOMBRE}
              aria-invalid={error.nombre ? true : undefined}
              aria-describedby={error.nombre ? "error-nombre" : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.nombre && (
            <p
              id="error-nombre"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.nombre}
            </p>
          )}
        </div>

        <div>
          <Campo etiqueta="Apellido">
            <input
              name="apellido"
              defaultValue={valor.texto("apellido", "")}
              autoComplete="family-name"
              required
              minLength={2}
              maxLength={ReglasDeRegistro.LARGO_NOMBRE}
              aria-invalid={error.apellido ? true : undefined}
              aria-describedby={error.apellido ? "error-apellido" : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.apellido && (
            <p
              id="error-apellido"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.apellido}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Campo
            etiqueta="Nombre de usuario"
            ayuda={
              error.nombre_usuario
                ? undefined
                : "Así te van a encontrar en la plataforma. No se puede repetir."
            }
          >
            <input
              name="nombre_usuario"
              defaultValue={valor.texto("nombre_usuario", "")}
              autoComplete="username"
              spellCheck={false}
              required
              minLength={ReglasDeRegistro.LARGO_USUARIO_MINIMO}
              maxLength={ReglasDeRegistro.LARGO_USUARIO_MAXIMO}
              aria-invalid={error.nombre_usuario ? true : undefined}
              aria-describedby={
                error.nombre_usuario ? "error-nombre_usuario" : undefined
              }
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.nombre_usuario && (
            <p
              id="error-nombre_usuario"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.nombre_usuario}
            </p>
          )}
        </div>

        <div>
          <Campo etiqueta="País">
            <input
              key={`pais-${envios}`}
              name="pais"
              autoComplete="country-name"
              defaultValue={valor.texto("pais", "Uruguay")}
              required
              maxLength={ReglasDeRegistro.LARGO_NOMBRE}
              aria-invalid={error.pais ? true : undefined}
              aria-describedby={error.pais ? "error-pais" : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.pais && (
            <p
              id="error-pais"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.pais}
            </p>
          )}
        </div>
      </div>

      <div>
        <Campo
          etiqueta="Fecha de nacimiento"
          ayuda={
            error.fecha_nacimiento
              ? undefined
              : `Tenés que tener al menos ${ReglasDeRegistro.EDAD_MINIMA} años.`
          }
        >
          <input
            type="date"
            name="fecha_nacimiento"
            defaultValue={valor.texto("fecha_nacimiento", "")}
            autoComplete="bday"
            required
            max={fechaMaximaDeNacimiento}
            aria-invalid={error.fecha_nacimiento ? true : undefined}
            aria-describedby={
              error.fecha_nacimiento ? "error-fecha_nacimiento" : undefined
            }
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
        {error.fecha_nacimiento && (
          <p
            id="error-fecha_nacimiento"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.fecha_nacimiento}
          </p>
        )}
      </div>

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

      <CampoImagen
        nombre="avatar"
        etiqueta="Foto de perfil"
        ayuda="Opcional. JPG, PNG o WebP, hasta 2 MB. La podés cambiar cuando quieras."
        estado={estado}
        error={error.avatar}
      />

      <SelectorIntereses
        key={`intereses-${envios}`}
        opciones={intereses}
        inicial={valor.lista("tags", [])}
        error={error.tags}
        esEjemplo={interesesDeEjemplo}
      />

      <Aceptacion
        key={`aceptacion-${envios}`}
        porDefecto={valor.texto("privacidad", "") === "si"}
        error={error.privacidad}
      />

      <MensajeDeAccion estado={estado} />

      <Boton type="submit" disabled={enCurso} className="w-full">
        {enCurso ? "Creando la cuenta…" : "Crear cuenta"}
      </Boton>
    </form>
  );
}

/**
 * El consentimiento de privacidad (RNF5).
 *
 * Va marcado a mano y nunca pre-marcado: un consentimiento que viene puesto no
 * es un consentimiento. El enlace abre en otra pestaña para que leerlo no
 * borre lo que ya se escribió en el formulario.
 */
export function Aceptacion({
  porDefecto = false,
  error,
}: {
  porDefecto?: boolean;
  error?: string;
} = {}) {
  return (
    <div>
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          name="privacidad"
          value="si"
          defaultChecked={porDefecto}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "error-privacidad" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-control border-borde-control accent-[var(--ly-acento)]"
        />
        <span className="text-[14px] leading-relaxed text-tinta">
          Leí y acepto la{" "}
          <Link
            href="/legales#privacidad"
            target="_blank"
            className="font-semibold text-acento underline underline-offset-2"
          >
            política de privacidad
          </Link>{" "}
          y los términos de uso.
        </span>
      </label>
      {error && (
        <p
          id="error-privacidad"
          className="mt-1 text-[13px] font-medium text-alerta"
        >
          {error}
        </p>
      )}
    </div>
  );
}
