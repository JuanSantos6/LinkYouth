import type { Metadata } from "next";

import {
  BotonMarcarAvisoLeido,
  BotonMarcarTodosLeidos,
  EnlaceDeAviso,
} from "@/components/avisos/ControlesDeAviso";
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
 * postulación (RF6.2). Desde acá solo se actualiza `leida`: `notificaciones`
 * no tiene política de insert, y así queda claro que ningún cliente puede
 * fabricar un aviso.
 */
export default async function PaginaAvisos() {
  const avisos = await obtenerAvisos((await obtenerUsuarioId()) ?? undefined);
  const esEjemplo = avisos.origen === "ejemplo";
  const haySinLeer = avisos.datos.some((aviso) => !aviso.leida);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Avisos"
        descripcion="Lo que pasó con tus postulaciones, de lo más reciente a lo más viejo."
        acciones={
          haySinLeer ? (
            <BotonMarcarTodosLeidos esEjemplo={esEjemplo} />
          ) : undefined
        }
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
                className={`flex flex-wrap items-start justify-between gap-3 py-4 ${
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

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {!aviso.leida && (
                    <BotonMarcarAvisoLeido
                      id={aviso.id}
                      esEjemplo={esEjemplo}
                    />
                  )}
                  {aviso.enlace && (
                    <EnlaceDeAviso
                      id={aviso.id}
                      href={aviso.enlace}
                      leida={aviso.leida}
                      esEjemplo={esEjemplo}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
