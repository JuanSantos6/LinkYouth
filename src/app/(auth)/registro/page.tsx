import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-tinta">Creá tu cuenta</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Tu primer empleo, prácticas y eventos, en un solo lugar.
        </p>
      </div>

      <Tarjeta className="p-6">
        <FormularioRegistro />
      </Tarjeta>

      <p className="text-center text-sm text-tinta-suave">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-primario">
          Iniciá sesión
        </Link>
      </p>
    </>
  );
}
