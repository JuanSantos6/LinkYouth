"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { CampoContrasenia } from "@/components/auth/CampoContrasenia";
import { CampoImagen } from "@/components/auth/CampoImagen";
import { RegistroPendiente } from "@/components/auth/RegistroPendiente";
import { SelectorIntereses } from "@/components/auth/SelectorIntereses";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { registrarse } from "@/lib/acciones/auth";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
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
}) {
  const [estado, enviar, enCurso] = useActionState(registrarse, ACCION_INICIAL);

  // El correo se guarda al tipearlo porque la acción no lo devuelve y, cuando
  // vuelve `ok`, el formulario ya se limpió. El campo sigue sin ser controlado:
  // se observa el valor, no se lo impone.
  const [email, setEmail] = useState("");

  // `ok` en este formulario solo puede significar una cosa: el `signUp` anduvo
  // pero no dejó sesión, porque falta confirmar el correo. Con sesión, la
  // acción redirige y nunca llega a devolver.
  if (estado.estado === "ok") {
    return <RegistroPendiente email={email} mensaje={estado.mensaje} />;
  }

  return (
    <form action={enviar} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            name="nombre"
            autoComplete="given-name"
            required
            minLength={2}
            maxLength={ReglasDeRegistro.LARGO_NOMBRE}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="Apellido">
          <input
            name="apellido"
            autoComplete="family-name"
            required
            minLength={2}
            maxLength={ReglasDeRegistro.LARGO_NOMBRE}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre de usuario"
          ayuda="Así te van a encontrar en la plataforma. No se puede repetir."
        >
          <input
            name="nombre_usuario"
            autoComplete="username"
            spellCheck={false}
            required
            minLength={ReglasDeRegistro.LARGO_USUARIO_MINIMO}
            maxLength={ReglasDeRegistro.LARGO_USUARIO_MAXIMO}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo etiqueta="País">
          <input
            name="pais"
            autoComplete="country-name"
            defaultValue="Uruguay"
            required
            maxLength={ReglasDeRegistro.LARGO_NOMBRE}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Fecha de nacimiento"
        ayuda={`Tenés que tener al menos ${ReglasDeRegistro.EDAD_MINIMA} años.`}
      >
        <input
          type="date"
          name="fecha_nacimiento"
          autoComplete="bday"
          required
          max={fechaMaximaDeNacimiento}
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

      <CampoContrasenia />

      <CampoImagen
        nombre="avatar"
        etiqueta="Foto de perfil"
        ayuda="Opcional. JPG, PNG o WebP, hasta 2 MB. La podés cambiar cuando quieras."
      />

      <SelectorIntereses opciones={intereses} esEjemplo={interesesDeEjemplo} />

      <Aceptacion />

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
export function Aceptacion() {
  return (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        name="privacidad"
        value="si"
        required
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
  );
}
