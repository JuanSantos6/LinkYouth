import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccionesDeBusqueda } from "@/components/empresa/AccionesDeBusqueda";
import { AvisoDeResultado } from "@/components/empresa/AvisoDeResultado";
import { InsigniaDeBusqueda } from "@/components/empresa/InsigniaDeBusqueda";
import { TarjetaDePostulante } from "@/components/empresa/TarjetaDePostulante";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { DetallesSuaves } from "@/components/ui/DetallesSuaves";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import {
  obtenerBusqueda,
  obtenerPostulacionesRecibidas,
} from "@/lib/data/empresa";
import type { OpcionCatalogo, PostulacionRecibida } from "@/lib/data/tipos";
import { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";
import {
  agruparPorEstado,
  type GrupoDeEstado,
} from "@/lib/dominio/EstadoParaEmpresa";
import { ETIQUETA_MODALIDAD } from "@/lib/dominio/ReglasDeBusqueda";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Búsqueda" };
export const dynamic = "force-dynamic";

type Evaluada = {
  postulacion: PostulacionRecibida;
  coincidencia: CoincidenciaDeCandidato;
};

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

function ListaDelGrupo({
  grupo,
  base,
}: {
  grupo: GrupoDeEstado<Evaluada>;
  base: string;
}) {
  if (grupo.items.length === 0) {
    return (
      <p className="rounded-ficha border border-dashed border-borde-control/60 px-3 py-3 text-center text-[13px] text-apagado">
        Nadie en este estado
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {grupo.items.map(({ postulacion, coincidencia }) => (
        <TarjetaDePostulante
          key={postulacion.id}
          postulacion={postulacion}
          coincidencia={coincidencia}
          href={`${base}/postulantes/${postulacion.id}`}
        />
      ))}
    </ul>
  );
}

/**
 * Los postulantes agrupados por estado, todos a la vista con el contador de
 * cada grupo. Son dos marcados del mismo contenido porque se comportan
 * distinto: en el teléfono, secciones apiladas y plegables (`<details>`,
 * «Nueva» abierta y las demás cerradas); en escritorio, un tablero por
 * columnas que nunca se pliega. Un `<details>` cerrado esconde su contenido
 * también en escritorio, así que no sirve un solo marcado para los dos.
 */
function TableroDePostulantes({
  grupos,
  base,
}: {
  grupos: GrupoDeEstado<Evaluada>[];
  base: string;
}) {
  return (
    <>
      <div className="space-y-2.5 lg:hidden">
        {grupos.map((grupo) => (
          <details
            key={grupo.estado}
            open={grupo.estado === "pendiente" && grupo.items.length > 0}
            className="group rounded-tarjeta border border-borde bg-superficie"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-tarjeta px-4 py-3 [&::-webkit-details-marker]:hidden">
              <h3 className="text-[16px] font-semibold text-tinta">
                {grupo.etiqueta}{" "}
                <span className="font-normal text-apagado">
                  · {grupo.items.length}
                </span>
              </h3>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0 text-apagado transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="px-3 pb-3">
              <ListaDelGrupo grupo={grupo} base={base} />
            </div>
          </details>
        ))}
      </div>

      <div
        className={`hidden gap-3 lg:grid ${
          grupos.length > 5 ? "lg:grid-cols-6" : "lg:grid-cols-5"
        }`}
      >
        {grupos.map((grupo) => (
          <section
            key={grupo.estado}
            aria-labelledby={`col-${grupo.estado}`}
            className="min-w-0 space-y-2 rounded-tarjeta bg-realce p-2.5"
          >
            <h3
              id={`col-${grupo.estado}`}
              className="px-1 pt-0.5 text-[14.5px] font-semibold text-tinta"
            >
              {grupo.etiqueta}{" "}
              <span className="font-normal text-apagado">
                · {grupo.items.length}
              </span>
            </h3>
            <ListaDelGrupo grupo={grupo} base={base} />
          </section>
        ))}
      </div>
    </>
  );
}

/**
 * Una búsqueda propia: sus datos, lo que se puede hacer con ella y quiénes se
 * postularon (RF3.4.1), agrupados por estado y, dentro de cada estado, de más
 * a menos coincidencia con lo que pide (RF3.4.2). Sin filtros: todo está a la
 * vista.
 */
export default async function PaginaBusqueda({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardada?: string; falto?: string }>;
}) {
  const [{ id }, { guardada, falto }] = await Promise.all([
    params,
    searchParams,
  ]);

  const resultado = await obtenerBusqueda(id);
  if (!resultado) notFound();
  const busqueda = resultado.datos;
  const esEjemplo = resultado.origen === "ejemplo";

  const postulaciones = await obtenerPostulacionesRecibidas(busqueda.id);
  const ordenadas = CoincidenciaDeCandidato.ordenar(
    CoincidenciaDeCandidato.requisitosDe(busqueda),
    postulaciones.datos,
  );
  const grupos = agruparPorEstado(
    ordenadas,
    ({ postulacion }) => postulacion.estado,
  );
  const base = `/empresa/busquedas/${busqueda.id}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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

      {falto && <AvisoDeResultado tono="error">{falto}</AvisoDeResultado>}

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

      <section aria-labelledby="t-postulantes" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="t-postulantes" className="text-[22px] text-tinta">
            Postulantes{" "}
            <span className="font-normal text-apagado">
              · {ordenadas.length}
            </span>
          </h2>
          {ordenadas.length > 1 && (
            <p className="text-[13px] text-apagado">
              En cada estado, primero quienes declaran más de lo que pedís.
            </p>
          )}
        </div>

        {ordenadas.length === 0 ? (
          <EstadoVacio
            ilustracion="postulaciones"
            titulo="Nadie se postuló todavía"
            descripcion={
              busqueda.estado === "activa"
                ? "Cuando alguien se postule lo vas a ver acá, en «Nueva»."
                : "La búsqueda no está activa, así que no recibe postulaciones."
            }
          />
        ) : (
          <TableroDePostulantes grupos={grupos} base={base} />
        )}
      </section>

      <DetallesSuaves
        resumen={
          <span className="text-[17px] font-bold text-tinta">
            Lo que publicaste
          </span>
        }
        className="rounded-tarjeta border border-borde bg-superficie px-5 py-4"
      >
        <div className="grid gap-5 pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-tinta">
              Habilidades pedidas
            </h3>
            <ListaDeEtiquetas opciones={busqueda.habilidades} />
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-tinta">
              Habilidades ocultas
            </h3>
            <p className="text-[13px] text-apagado">
              Solo las ves vos: cuentan para la coincidencia, pero no aparecen
              en la publicación.
            </p>
            <ListaDeEtiquetas opciones={busqueda.habilidadesOcultas} />
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

          <div className="space-y-2 md:col-span-2">
            <h3 className="text-[14px] font-semibold text-tinta">
              Descripción
            </h3>
            <p className="max-w-[70ch] text-[14.5px] leading-relaxed whitespace-pre-line text-tinta">
              {busqueda.descripcion}
            </p>
          </div>
        </div>
      </DetallesSuaves>
    </div>
  );
}
