import type { Metadata } from "next";
import Link from "next/link";

import { AvisoDeResultado } from "@/components/empresa/AvisoDeResultado";
import { InsigniaDeBusqueda } from "@/components/empresa/InsigniaDeBusqueda";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonEnlace } from "@/components/ui/Boton";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { FiltroDeslizante } from "@/components/ui/FiltroDeslizante";
import { obtenerBusquedas } from "@/lib/data/empresa";
import { ESTADOS_VACANTE, type EstadoVacante } from "@/lib/data/tipos";
import { ETIQUETA_MODALIDAD } from "@/lib/dominio/ReglasDeBusqueda";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Mis búsquedas" };
export const dynamic = "force-dynamic";

const PLURAL: Record<EstadoVacante, string> = {
  activa: "Activas",
  pausada: "Pausadas",
  cerrada: "Cerradas",
};

/**
 * Mis búsquedas (RF3.1–RF3.3, RF7.1.1): todas las de la empresa, con cuántas
 * personas se postularon y cuántas nadie miró todavía. El filtro por estado
 * es un enlace con `searchParams`, como en todas las pantallas.
 */
export default async function PaginaBusquedas({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; eliminada?: string }>;
}) {
  const { estado, eliminada } = await searchParams;
  const filtro = (ESTADOS_VACANTE as readonly string[]).includes(estado ?? "")
    ? (estado as EstadoVacante)
    : undefined;

  const resultado = await obtenerBusquedas();
  const todas = resultado.datos;
  const busquedas = filtro ? todas.filter((b) => b.estado === filtro) : todas;

  const opciones = [
    { href: "/empresa/busquedas", etiqueta: "Todas", activa: !filtro },
    ...ESTADOS_VACANTE.map((valor) => ({
      href: `/empresa/busquedas?estado=${valor}`,
      etiqueta: PLURAL[valor],
      activa: filtro === valor,
    })),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Encabezado
        titulo="Mis búsquedas"
        descripcion="Lo que publicaste, quiénes se postularon y en qué quedó cada búsqueda."
        acciones={
          <BotonEnlace href="/empresa/busquedas/nueva" variante="primario">
            Publicar búsqueda
          </BotonEnlace>
        }
      />

      {eliminada && (
        <AvisoDeResultado>La búsqueda se eliminó.</AvisoDeResultado>
      )}

      <AvisoOrigen resultado={resultado} />

      {todas.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <FiltroDeslizante
            etiqueta="Estado de la búsqueda"
            opciones={opciones}
          />
        </div>
      )}

      {todas.length === 0 ? (
        <EstadoVacio
          nivel={2}
          ilustracion="busquedas"
          titulo="Todavía no publicaste búsquedas"
          descripcion="Contá qué hace falta, qué habilidades pedís y dónde es. Vas a ver acá quiénes se postulan y cuánto declaran de lo que pedís."
          accion={
            <BotonEnlace href="/empresa/busquedas/nueva">
              Publicar la primera
            </BotonEnlace>
          }
        />
      ) : busquedas.length === 0 ? (
        <EstadoVacio
          nivel={2}
          ilustracion="busquedas"
          titulo={`No tenés búsquedas ${PLURAL[filtro!].toLowerCase()}`}
          descripcion="Probá con otro estado, o mirá todas juntas."
          accion={
            <BotonEnlace href="/empresa/busquedas">Ver todas</BotonEnlace>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {busquedas.map((busqueda) => (
            <li
              key={busqueda.id}
              className="relative rounded-tarjeta border border-borde bg-superficie p-5 transition-shadow duration-150 hover:shadow-elevada sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <h2 className="text-[19px] font-bold text-tinta">
                  <Link
                    href={`/empresa/busquedas/${busqueda.id}`}
                    className="underline-offset-4 after:absolute after:inset-0 hover:underline"
                  >
                    {busqueda.titulo}
                  </Link>
                </h2>
                <InsigniaDeBusqueda estado={busqueda.estado} />
              </div>

              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13.5px] text-apagado">
                <span>{etiquetaTipo(busqueda.tipo)}</span>
                {busqueda.modalidad && (
                  <span>{ETIQUETA_MODALIDAD[busqueda.modalidad]}</span>
                )}
                {busqueda.ubicacion && <span>{busqueda.ubicacion}</span>}
                <span>
                  {busqueda.posiciones}{" "}
                  {busqueda.posiciones === 1 ? "posición" : "posiciones"}
                </span>
                <span>publicada {tiempoRelativo(busqueda.creada_en)}</span>
              </p>

              <p className="mt-3 text-[14.5px] text-tinta">
                {busqueda.postulaciones === 0 ? (
                  <span className="text-apagado">
                    Sin postulaciones todavía
                  </span>
                ) : (
                  <>
                    <span className="cifra font-bold">
                      {busqueda.postulaciones}
                    </span>{" "}
                    {busqueda.postulaciones === 1
                      ? "postulación"
                      : "postulaciones"}
                    {busqueda.nuevas > 0 && (
                      <>
                        {" · "}
                        <span className="font-semibold text-acento">
                          {busqueda.nuevas}{" "}
                          {busqueda.nuevas === 1 ? "nueva" : "nuevas"}
                        </span>
                      </>
                    )}
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
