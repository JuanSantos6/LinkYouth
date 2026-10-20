"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Boton } from "@/components/ui/Boton";

/**
 * Lo que se ve si una pantalla de empresa falla al cargarse: qué pasó y cómo
 * seguir, sin el detalle técnico (que va a la consola del navegador).
 */
export default function ErrorDeEmpresa({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-xl space-y-4 rounded-tarjeta border border-borde bg-superficie p-8 text-center"
    >
      <h1 className="text-[24px] font-extrabold text-tinta">
        No se pudo cargar esta pantalla
      </h1>
      <p className="text-[15px] text-apagado">
        Puede ser un corte momentáneo de la conexión con la base. Probá de nuevo
        en unos segundos; si sigue pasando, escribinos desde Contacto.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Boton type="button" variante="secundario" onClick={reset}>
          Probar de nuevo
        </Boton>
        <Link
          href="/empresa"
          className="inline-flex items-center px-2 text-[15px] font-medium text-acento underline-offset-4 hover:underline"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
