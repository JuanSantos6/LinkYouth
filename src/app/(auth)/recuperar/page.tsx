import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRecuperar } from "@/components/auth/FormularioRecuperar";
import { TarjetaDeAcceso } from "@/components/auth/TarjetaDeAcceso";

export const metadata: Metadata = { title: "Recuperar la contraseña" };

const MOTIVOS: Record<string, string> = {
  vencido:
    "El enlace ya no sirve: vence en una hora y se usa una sola vez. Pedí uno nuevo.",
};

/** RF1.8 — Recuperar la contraseña. */
export default async function PaginaRecuperar({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const aviso = motivo ? MOTIVOS[motivo] : undefined;

  return (
    <TarjetaDeAcceso
      titulo="¿Te olvidaste la contraseña?"
      bajada="Escribí el correo de tu cuenta y te mandamos un enlace para elegir una nueva."
      alternativa={
        <>
          ¿Te acordaste?{" "}
          <Link
            href="/login"
            className="font-semibold text-acento underline-offset-4 hover:underline"
          >
            Volvé a iniciar sesión
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {aviso && (
          <p
            role="alert"
            className="rounded-control border border-borde bg-superficie p-3 text-[15px] text-tinta"
          >
            {aviso}
          </p>
        )}
        <FormularioRecuperar />
      </div>
    </TarjetaDeAcceso>
  );
}
