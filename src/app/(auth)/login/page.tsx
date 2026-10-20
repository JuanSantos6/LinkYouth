import type { Metadata } from "next";
import Link from "next/link";

import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { PestanasDeCuenta } from "@/components/auth/PestanasDeCuenta";
import { TarjetaDeAcceso } from "@/components/auth/TarjetaDeAcceso";
import { conSiguiente, destinoSeguro } from "@/lib/navegacion";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** Lo que vuelve de `/auth/callback` al confirmar el correo del registro. */
const AVISOS_DE_CORREO: Record<string, string> = {
  confirmado:
    "Tu correo quedó confirmado. Iniciá sesión para terminar el alta.",
  vencido:
    "El enlace ya no sirve: se usa una sola vez y vence. Iniciá sesión y, si hace falta, registrate de nuevo.",
};

/**
 * El formulario es uno solo para los dos tipos de cuenta: la contraseña se
 * verifica igual y el tipo ya lo sabe la base, que es la que decide a qué
 * mitad de la aplicación entrás. El `?tipo` de la portada solo adapta la
 * bajada y el enlace al registro correcto — pedirle a alguien que elija de
 * nuevo algo que el sistema ya sabe sería trabajo inventado.
 *
 * `?next` es la pantalla que se había pedido: el middleware lo agrega al
 * mandar acá a quien no tenía sesión, y el formulario lo devuelve ahí.
 */
export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; next?: string; correo?: string }>;
}) {
  const { tipo, next, correo } = await searchParams;
  const avisoDeCorreo = correo ? AVISOS_DE_CORREO[correo] : undefined;
  const esEmpresa = tipo === "empresa";
  const siguiente = destinoSeguro(next);

  return (
    <TarjetaDeAcceso
      titulo={esEmpresa ? "Hola de nuevo" : "Qué bueno verte de nuevo"}
      bajada={
        esEmpresa
          ? "Entrá al panel de tu organización para ver tus búsquedas y tus eventos."
          : "Seguí tus postulaciones y enterate de los próximos eventos."
      }
      alternativa={
        <>
          {esEmpresa
            ? "¿Tu organización todavía no tiene cuenta?"
            : "¿Todavía no tenés cuenta?"}{" "}
          <Link
            href={
              esEmpresa
                ? "/registro?tipo=empresa"
                : conSiguiente("/registro", siguiente)
            }
            className="font-semibold text-acento underline-offset-4 hover:underline"
          >
            Creá una
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {avisoDeCorreo && (
          <p
            role="status"
            className="rounded-control border border-borde bg-superficie p-3 text-[15px] text-tinta"
          >
            {avisoDeCorreo}
          </p>
        )}
        <PestanasDeCuenta
          activo={esEmpresa ? "empresa" : "individual"}
          destinos={{
            individual: conSiguiente("/login", siguiente),
            empresa: conSiguiente("/login", siguiente, { tipo: "empresa" }),
          }}
        />
        <FormularioLogin
          siguiente={siguiente}
          tipo={esEmpresa ? "empresa" : "individual"}
        />
      </div>
    </TarjetaDeAcceso>
  );
}
