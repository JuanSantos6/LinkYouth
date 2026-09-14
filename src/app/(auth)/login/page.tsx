import type { Metadata } from "next";
import Link from "next/link";

import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    <>
      <div>
        <h1 className="text-[26px] text-tinta">Entrá a LinkYouth</h1>
        <p className="mt-1 text-[14px] text-apagado">
          Seguí tus postulaciones y enterate de los próximos eventos.
        </p>
      </div>

      <Tarjeta className="p-6">
        <FormularioLogin />
      </Tarjeta>

      <p className="text-center text-[14px] text-apagado">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-acento">
          Creá una
        </Link>
      </p>
    </>
  );
}
