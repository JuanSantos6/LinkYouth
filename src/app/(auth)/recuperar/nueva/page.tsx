import type { Metadata } from "next";
import Link from "next/link";

import { FormularioContraseniaNueva } from "@/components/auth/FormularioContraseniaNueva";
import { TarjetaDeAcceso } from "@/components/auth/TarjetaDeAcceso";

export const metadata: Metadata = { title: "Contraseña nueva" };

/**
 * RF1.8.4 — Se llega desde el enlace del correo, con la sesión que abrió
 * `/auth/callback`. Sin sesión, el middleware manda a `/recuperar`.
 */
export default function PaginaContraseniaNueva() {
  return (
    <TarjetaDeAcceso
      titulo="Elegí tu contraseña nueva"
      bajada="Escribila dos veces para confirmarla."
      alternativa={
        <Link
          href="/recuperar"
          className="font-semibold text-acento underline-offset-4 hover:underline"
        >
          Pedir otro enlace
        </Link>
      }
    >
      <FormularioContraseniaNueva />
    </TarjetaDeAcceso>
  );
}
