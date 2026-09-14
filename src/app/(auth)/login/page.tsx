import type { Metadata } from "next";
import Link from "next/link";

import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = { title: "Iniciar sesión" };

/**
 * El formulario es uno solo para los dos tipos de cuenta: la contraseña se
 * verifica igual y el tipo ya lo sabe la base, que es la que decide a qué
 * mitad de la aplicación entrás. El `?tipo` de la portada solo adapta la
 * bajada y el enlace al registro correcto — pedirle a alguien que elija de
 * nuevo algo que el sistema ya sabe sería trabajo inventado.
 */
export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const esEmpresa = tipo === "empresa";

  return (
    <>
      <div>
        <h1 className="text-[26px] text-tinta">Entrá a LinkYouth</h1>
        <p className="mt-1 text-[14px] text-apagado">
          {esEmpresa
            ? "Entrá al panel de tu organización."
            : "Seguí tus postulaciones y enterate de los próximos eventos."}
        </p>
      </div>

      <Tarjeta className="p-6">
        <FormularioLogin />
      </Tarjeta>

      <p className="text-center text-[14px] text-apagado">
        ¿Todavía no tenés cuenta?{" "}
        <Link
          href={esEmpresa ? "/registro?tipo=empresa" : "/registro"}
          className="font-semibold text-acento"
        >
          Creá una
        </Link>
      </p>
    </>
  );
}
