import type { Metadata } from "next";
import Link from "next/link";

import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { TarjetaDeAcceso } from "@/components/auth/TarjetaDeAcceso";
import { conSiguiente, destinoSeguro } from "@/lib/navegacion";

export const metadata: Metadata = { title: "Iniciar sesión" };

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
  searchParams: Promise<{ tipo?: string; next?: string }>;
}) {
  const { tipo, next } = await searchParams;
  const esEmpresa = tipo === "empresa";
  const siguiente = destinoSeguro(next);

  return (
    <TarjetaDeAcceso
      titulo={esEmpresa ? "Hola de nuevo" : "Qué bueno verte de nuevo"}
      bajada={
        esEmpresa
          ? "Entrá al panel de tu organización."
          : "Seguí tus postulaciones y enterate de los próximos eventos."
      }
      alternativa={
        <>
          ¿Todavía no tenés cuenta?{" "}
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
      <FormularioLogin siguiente={siguiente} />
    </TarjetaDeAcceso>
  );
}
