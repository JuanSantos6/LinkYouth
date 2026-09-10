import type { Metadata } from "next";
import Link from "next/link";

import { BotonCancelarPostulacion } from "@/components/empleos/BotonCancelarPostulacion";
import { Encabezado } from "@/components/layout/Encabezado";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { obtenerPostulaciones } from "@/lib/data/consultas";
import type { EstadoPostulacion } from "@/lib/data/tipos";
import { etiquetaEstadoPostulacion, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Postulaciones" };
export const dynamic = "force-dynamic";

const TONOS: Record<
  EstadoPostulacion,
  "neutro" | "primario" | "exito" | "alerta"
> = {
  pendiente: "neutro",
  en_revision: "primario",
  aceptada: "exito",
  rechazada: "alerta",
  cancelada: "neutro",
};

/** Estados en los que el postulante todavía puede cancelar (RF3.8). */
const CANCELABLES: EstadoPostulacion[] = ["pendiente", "en_revision"];

const PASOS = ["Enviada", "En revisión", "Resolución"] as const;

function pasoActual(estado: EstadoPostulacion): number {
  if (estado === "pendiente") return 0;
  if (estado === "en_revision") return 1;
  return 2;
}

/**
 * Seguimiento del proceso (RF3.7.2).
 *
 * El objetivo del producto es que el proceso deje de ser opaco, así que el
 * estado se muestra como recorrido y no como una palabra suelta: se ve dónde
 * está la postulación y cuánto falta.
 */
function Recorrido({ estado }: { estado: EstadoPostulacion }) {
  const actual = pasoActual(estado);
  const negativo = estado === "rechazada" || estado === "cancelada";

  return (
    <ol className="mt-4 flex items-center gap-2">
      {PASOS.map((paso, indice) => {
        const alcanzado = indice <= actual;
        const esFinalNegativo = negativo && indice === 2;

        return (
          <li key={paso} className="flex flex-1 items-center gap-2">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${
                  esFinalNegativo
                    ? "bg-alerta"
                    : alcanzado
                      ? "bg-primario"
                      : "bg-borde-fuerte"
                }`}
              />
              <span
                className={`text-xs ${
                  alcanzado ? "font-semibold text-tinta" : "text-tinta-tenue"
                }`}
              >
                {paso}
              </span>
            </span>

            {indice < PASOS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${
                  indice < actual ? "bg-primario" : "bg-borde"
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
    <div className="mx-auto max-w-4xl space-y-5">
      <Encabezado
        titulo="Mis postulaciones"
        descripcion="El estado de cada proceso, actualizado por la empresa que publicó la búsqueda."
      />

      <AvisoOrigen resultado={postulaciones} />

      <section className="space-y-4">
        {postulaciones.datos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no te postulaste a ninguna búsqueda"
            descripcion="Cuando te postules, vas a poder seguir acá en qué etapa está cada proceso."
            accion={
              <Link
                href="/empleos"
                className="text-sm font-semibold text-primario hover:underline"
              >
                Ver empleos y pasantías
              </Link>
            }
          />
        ) : (
          postulaciones.datos.map((postulacion) => (
            <Tarjeta key={postulacion.id} como="article" className="p-5">
              <div className="flex items-start gap-4">
                <Avatar
                  nombre={postulacion.vacante.empresa}
                  url={postulacion.vacante.empresa_logo_url}
                  forma="cuadrado"
                  tamano="sm"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-tinta">
                    {postulacion.vacante.titulo}
                  </h2>
                  <p className="mt-0.5 text-xs text-tinta-suave">
                    {postulacion.vacante.empresa} · enviada{" "}
                    {tiempoRelativo(postulacion.creada_en)}
                  </p>
                </div>

                <Insignia tono={TONOS[postulacion.estado]}>
                  {etiquetaEstadoPostulacion(postulacion.estado)}
                </Insignia>
              </div>

              <Recorrido estado={postulacion.estado} />

              {CANCELABLES.includes(postulacion.estado) && (
                <div className="mt-3 flex justify-end border-t border-borde pt-3">
                  <BotonCancelarPostulacion postulacionId={postulacion.id} />
                </div>
              )}
            </Tarjeta>
          ))
        )}
      </section>
    </div>
  );
}
