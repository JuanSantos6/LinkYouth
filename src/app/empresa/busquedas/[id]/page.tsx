import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccionesDeBusqueda } from "@/components/empresa/AccionesDeBusqueda";
import { AvisoDeResultado } from "@/components/empresa/AvisoDeResultado";
import { FilaDePostulante } from "@/components/empresa/FilaDePostulante";
import { InsigniaDeBusqueda } from "@/components/empresa/InsigniaDeBusqueda";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { DetallesSuaves } from "@/components/ui/DetallesSuaves";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FiltroDeslizante } from "@/components/ui/FiltroDeslizante";
import {
  obtenerBusqueda,
  obtenerPostulacionesRecibidas,
} from "@/lib/data/empresa";
import type { EstadoPostulacion, OpcionCatalogo } from "@/lib/data/tipos";
import { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";
import {
  ESTADOS_PARA_EMPRESA,
  EstadoParaEmpresa,
} from "@/lib/dominio/EstadoParaEmpresa";
import { ETIQUETA_MODALIDAD } from "@/lib/dominio/ReglasDeBusqueda";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Búsqueda" };
export const dynamic = "force-dynamic";

const nombres = (opciones: OpcionCatalogo[]) => opciones.map((o) => o.nombre);

function ListaDeEtiquetas({ opciones }: { opciones: OpcionCatalogo[] }) {
  if (opciones.length === 0) {
    return <p className="text-[14px] text-apagado">Ninguna.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {opciones.map((o) => (
        <li key={o.id}>
          <Etiqueta>{o.nombre}</Etiqueta>
        </li>
      ))}
    </ul>
  );
}

/**
 * Una búsqueda propia: sus datos, lo que se puede hacer con ella y quiénes se
 * postularon (RF3.4.1), de más a menos coincidencia con lo que pide (RF3.4.2).
 */
export default async function PaginaBusqueda({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ estado?: string; guardada?: string }>;
}) {
  const [{ id }, { estado, guardada }] = await Promise.all([
    params,
    searchParams,
  ]);

  const resultado = await obtenerBusqueda(id);
  if (!resultado) notFound();
  const busqueda = resultado.datos;
  const esEjemplo = resultado.origen === "ejemplo";

  const postulaciones = await obtenerPostulacionesRecibidas(busqueda.id);
  const ordenadas = CoincidenciaDeCandidato.ordenar(
    {
      habilidades: nombres(busqueda.habilidades),
      tagsOcultos: nombres(busqueda.tagsOcultos),
    },
    postulaciones.datos,
  );

  const filtro = (ESTADOS_PARA_EMPRESA as readonly string[]).includes(
    estado ?? "",
  )
    ? (estado as EstadoPostulacion)
    : undefined;
  const visibles = filtro
    ? ordenadas.filter(({ postulacion }) => postulacion.estado === filtro)
    : ordenadas;

  const cuantas = (e: EstadoPostulacion) =>
    ordenadas.filter(({ postulacion }) => postulacion.estado === e).length;
  const base = `/empresa/busquedas/${busqueda.id}`;
  const opciones = [
    { href: base, etiqueta: `Todas (${ordenadas.length})`, activa: !filtro },
    ...ESTADOS_PARA_EMPRESA.map((e) => ({
      href: `${base}?estado=${e}`,
      etiqueta: `${new EstadoParaEmpresa(e).etiqueta} (${cuantas(e)})`,
      activa: filtro === e,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/empresa/busquedas"
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← Mis búsquedas
      </Link>

      {guardada && (
        <AvisoDeResultado>
          {busqueda.estado === "activa"
            ? "Listo: la búsqueda está publicada y ya la pueden ver los jóvenes."
            : "Listo: se guardaron los cambios."}
        </AvisoDeResultado>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[32px]">
            {busqueda.titulo}
          </h1>
          <InsigniaDeBusqueda estado={busqueda.estado} />
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-apagado">
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
        <AccionesDeBusqueda busqueda={busqueda} esEjemplo={esEjemplo} />
      </header>

      <AvisoOrigen resultado={resultado} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <section aria-labelledby="t-postulantes" className="min-w-0 space-y-4">
          <h2 id="t-postulantes" className="text-[22px] text-tinta">
            Postulantes
          </h2>

          {ordenadas.length === 0 ? (
            <EstadoVacio
              titulo="Nadie se postuló todavía"
              descripcion={
                busqueda.estado === "activa"
                  ? "Cuando alguien se postule lo vas a ver acá, con las habilidades que declara de las que pedís."
                  : "La búsqueda no está activa, así que no recibe postulaciones. Reactivala para que vuelva a verse."
              }
            />
          ) : (
            <>
              <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                <FiltroDeslizante
                  etiqueta="Estado de la postulación"
                  opciones={opciones}
                />
              </div>
              <p className="text-[13.5px] text-apagado">
                Ordenados por cuántas de las habilidades pedidas declaran, y
                después por intereses clave.
              </p>

              {visibles.length === 0 ? (
                <EstadoVacio
                  titulo="No hay postulaciones en este estado"
                  descripcion="Probá con otro estado, o mirá todas."
                />
              ) : (
                <ul className="divide-y divide-filete border-y border-filete">
                  {visibles.map(({ postulacion, coincidencia }) => (
                    <FilaDePostulante
                      key={postulacion.id}
                      postulacion={postulacion}
                      coincidencia={coincidencia}
                      href={`${base}/postulantes/${postulacion.id}`}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <aside
          aria-labelledby="t-detalle"
          className="h-fit space-y-5 rounded-tarjeta border border-borde bg-superficie p-5"
        >
          <h2 id="t-detalle" className="text-[17px] font-bold text-tinta">
            Lo que publicaste
          </h2>

          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-tinta">
              Habilidades pedidas
            </h3>
            <ListaDeEtiquetas opciones={busqueda.habilidades} />
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-tinta">Áreas</h3>
            <ListaDeEtiquetas opciones={busqueda.tags} />
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-tinta">
              Intereses clave
            </h3>
            <p className="text-[13px] text-apagado">
              Solo los ves vos: no aparecen en la publicación.
            </p>
            <ListaDeEtiquetas opciones={busqueda.tagsOcultos} />
          </div>

          <DetallesSuaves resumen="Descripción">
            <p className="text-[14.5px] leading-relaxed whitespace-pre-line text-tinta">
              {busqueda.descripcion}
            </p>
          </DetallesSuaves>
        </aside>
      </div>
    </div>
  );
}
