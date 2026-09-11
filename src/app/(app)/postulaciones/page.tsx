import type { Metadata } from "next";
import Link from "next/link";

import { BotonCancelarPostulacion } from "@/components/empleos/BotonCancelarPostulacion";
import { Encabezado } from "@/components/layout/Encabezado";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { obtenerPostulaciones } from "@/lib/data/consultas";
import {
  ETAPAS,
  ProcesoDePostulacion,
} from "@/lib/dominio/ProcesoDePostulacion";
import { tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Postulaciones" };
export const dynamic = "force-dynamic";

/**
 * El recorrido del proceso (RF3.7.2).
 *
 * El producto existe para que el proceso deje de ser opaco, así que el estado
 * se muestra como recorrido y no como una palabra suelta: se ve dónde está la
 * postulación y cuánto falta. Qué etapa alcanzó lo decide
 * `ProcesoDePostulacion`, no esta función.
 */
function Recorrido({ proceso }: { proceso: ProcesoDePostulacion }) {
  return (
    <ol className="mt-4 flex items-center gap-3">
      {ETAPAS.map((etapa, indice) => {
        const alcanzada = proceso.alcanzo(indice);
        const cierreNegativo =
          proceso.cerradoSinPuesto && indice === ETAPAS.length - 1;

        return (
          <li key={etapa} className="flex flex-1 items-center gap-3">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  alcanzada && !cierreNegativo ? "bg-acento" : "bg-borde"
                }`}
              />
              <span
                className={`text-[13px] ${
                  alcanzada ? "text-tinta" : "text-apagado"
                }`}
              >
                {etapa}
              </span>
            </span>

            {indice < ETAPAS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${
                  proceso.alcanzo(indice + 1) ? "bg-acento" : "bg-filete"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function PaginaPostulaciones() {
  const postulaciones = await obtenerPostulaciones();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Mis postulaciones"
        descripcion="El estado de cada proceso, actualizado por la empresa que publicó la búsqueda."
      />

      <AvisoOrigen resultado={postulaciones} />

      <section>
        {postulaciones.datos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no te postulaste a ninguna búsqueda"
            descripcion="Cuando te postules, vas a poder seguir acá en qué etapa está cada proceso."
            accion={
              <Link
                href="/empleos"
                className="text-[14px] font-medium text-acento hover:underline"
              >
                Ver empleos y pasantías
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-filete border-y border-filete">
            {postulaciones.datos.map((postulacion) => {
              const proceso = new ProcesoDePostulacion(postulacion.estado);

              return (
                <li key={postulacion.id} className="py-5">
                  <div className="flex items-start gap-4">
                    <Avatar
                      nombre={postulacion.vacante.empresa}
                      url={postulacion.vacante.empresa_logo_url}
                      forma="cuadrado"
                      tamano="sm"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="text-[16px] font-medium text-tinta">
                        {postulacion.vacante.titulo}
                      </h2>
                      <p className="mt-0.5 flex flex-wrap gap-x-4 text-[13px] text-apagado">
                        <span>{postulacion.vacante.empresa}</span>
                        <span>
                          enviada {tiempoRelativo(postulacion.creada_en)}
                        </span>
                      </p>
                    </div>

                    <Insignia tono={proceso.aceptada ? "acreditado" : "neutro"}>
                      {proceso.etiqueta}
                    </Insignia>
                  </div>

                  <Recorrido proceso={proceso} />

                  {proceso.cancelable && (
                    <div className="mt-3 flex justify-end">
                      <BotonCancelarPostulacion
                        postulacionId={postulacion.id}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
