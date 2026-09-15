import type { Metadata } from "next";
import Link from "next/link";

import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { obtenerAvisos, obtenerUsuarioId } from "@/lib/data/consultas";
import { tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

/**
 * Bandeja de avisos (RF6.1).
 *
 * Las filas las crea la base cuando una empresa mueve el estado de una
 * postulación (RF6.2). Desde acá no se escribe nada: `notificaciones` no tiene
 * política de insert, y así queda claro que ningún cliente puede fabricar un
 * aviso.
 */
export default async function PaginaAvisos() {
  const avisos = await obtenerAvisos((await obtenerUsuarioId()) ?? undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Avisos"
        descripcion="Lo que pasó con tus postulaciones, de lo más reciente a lo más viejo."
      />

      <AvisoOrigen resultado={avisos} />

      <section>
        {avisos.datos.length === 0 ? (
          <EstadoVacio
            titulo="No tenés avisos"
            descripcion="Cuando una empresa mueva el estado de alguna de tus postulaciones, te lo contamos acá."
          />
        ) : (
          <ul className="divide-y divide-filete border-y border-filete">
            {avisos.datos.map((aviso) => (
              <li
                key={aviso.id}
                className={`flex items-start gap-3 py-4 ${
                  aviso.leida ? "" : "border-l-2 border-acento pl-3"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-tinta">{aviso.mensaje}</p>
                  <p className="mt-1 text-[13px] text-apagado">
                    {aviso.leida ? "Leído" : "Sin leer"}
                    <span className="ml-4">
                      {tiempoRelativo(aviso.creada_en)}
                    </span>
                  </p>
                </div>

                {aviso.enlace && (
                  <Link
                    href={aviso.enlace}
                    className="shrink-0 text-[14px] font-medium text-acento hover:underline"
                  >
                    Ver
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
