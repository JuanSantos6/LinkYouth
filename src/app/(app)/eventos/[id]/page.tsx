import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComoLlegar } from "@/components/eventos/ComoLlegar";
import { AccionDeInscripcion } from "@/components/eventos/TarjetaEvento";
import { MapaInteractivo } from "@/components/mapa/MapaInteractivo";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FotoConCredito } from "@/components/ui/FotoConCredito";
import {
  obtenerEvento,
  obtenerEventosInscriptos,
  obtenerUsuarioId,
} from "@/lib/data/consultas";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";
import { fechaBloque, fechaLarga, hora } from "@/lib/formato";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const evento = await obtenerEvento(id);

  return { title: evento?.datos.titulo ?? "Evento" };
}

/**
 * RF4.4 — El detalle de un evento para el joven: cuándo y dónde es, quién lo
 * organiza, de qué se trata, el mapa con su marcador, «Cómo llegar» y el botón
 * para inscribirse o cancelar la inscripción (RF4.5, RF4.6).
 *
 * Se lee con o sin sesión; sin sesión, «Inscribirme» lleva a crear la cuenta y
 * vuelve a este mismo evento.
 */
export default async function PaginaDetalleEvento({ params }: Props) {
  const { id } = await params;

  const usuarioId = (await obtenerUsuarioId()) ?? undefined;
  const conSesion = usuarioId !== undefined;

  const [resultado, yaInscriptos] = await Promise.all([
    obtenerEvento(id),
    obtenerEventosInscriptos(usuarioId),
  ]);

  if (!resultado) notFound();

  const evento = resultado.datos;
  const esEjemplo = resultado.origen === "ejemplo";
  const yaInscripto = yaInscriptos.has(evento.id);
  const { dia, mes } = fechaBloque(evento.fecha_hora);
  const conMapa = ReglasDeEvento.tieneUbicacion(evento);

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <EnlaceTransicion
        href="/eventos"
        className="inline-flex rounded-control px-1 py-1 text-[14px] font-medium text-apagado transition-colors duration-150 hover:text-tinta"
      >
        <span aria-hidden="true">←&nbsp;</span>Todos los eventos
      </EnlaceTransicion>

      <AvisoOrigen resultado={resultado} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)] lg:items-start">
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                nombre={evento.empresa.razon_social}
                url={evento.empresa.logo_url}
                semilla={evento.empresa.id}
                forma="cuadrado"
              />
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px] text-apagado">
                <EnlaceTransicion
                  href={`/organizaciones/${evento.empresa.id}`}
                  className="font-semibold text-tinta underline-offset-4 hover:text-acento hover:underline"
                >
                  {evento.empresa.razon_social}
                </EnlaceTransicion>
                <span>{evento.empresa.rubro}</span>
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex h-[68px] w-16 shrink-0 flex-col items-center justify-center rounded-ficha bg-lavanda"
              >
                <span className="cifra text-[28px] text-tinta">{dia}</span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-acento">
                  {mes}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[34px]">
                  {evento.titulo}
                </h1>
                <p className="text-[15px] text-tinta">
                  <time dateTime={evento.fecha_hora}>
                    {fechaLarga(evento.fecha_hora)}
                  </time>
                  <span className="ml-3 text-apagado">
                    {hora(evento.fecha_hora)}
                  </span>
                </p>
                {evento.direccion && (
                  <p className="text-[14.5px] text-apagado">
                    {evento.direccion}
                  </p>
                )}
              </div>
            </div>
          </header>

          <FotoConCredito
            url={evento.imagen_url}
            alt={`Foto del evento ${evento.titulo}`}
            ancho={1280}
            alto={720}
            credito={evento.credito}
            className="aspect-[16/9] max-h-72 w-full rounded-tarjeta border border-borde"
          />

          <section className="space-y-2">
            <h2 className="text-[20px] text-tinta">De qué se trata</h2>
            <p className="max-w-[65ch] whitespace-pre-line text-[16px] leading-relaxed text-apagado">
              {evento.descripcion}
            </p>
          </section>

          {evento.tags.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[20px] text-tinta">Áreas</h2>
              <ul className="flex flex-wrap gap-1.5">
                {evento.tags.map((tag) => (
                  <li key={tag}>
                    <Etiqueta>{tag}</Etiqueta>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(conMapa || evento.direccion) && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-[20px] text-tinta">Dónde es</h2>
                  {evento.direccion && (
                    <p className="text-[14.5px] text-apagado">
                      {evento.direccion}
                    </p>
                  )}
                </div>
                <ComoLlegar evento={evento} />
              </div>

              {conMapa && (
                <MapaInteractivo
                  puntos={[
                    {
                      id: evento.id,
                      titulo: evento.titulo,
                      latitud: evento.latitud,
                      longitud: evento.longitud,
                    },
                  ]}
                  respaldoSinJs={evento.direccion ?? evento.titulo}
                  etiqueta={`Ubicación de ${evento.titulo}`}
                />
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4 rounded-tarjeta border border-borde bg-superficie p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="space-y-1">
            <h2 className="text-[16px] font-bold text-tinta">Inscripción</h2>
            <p className="text-[13.5px] text-apagado">
              La participación es gratuita. Si el evento se cancela, te avisamos
              en tu bandeja.
            </p>
          </div>

          <div className="space-y-2 [&_form]:w-full [&_form_button]:w-full [&>div]:items-stretch">
            <AccionDeInscripcion
              eventoId={evento.id}
              yaInscripto={yaInscripto}
              esEjemplo={esEjemplo}
              conSesion={conSesion}
              siguiente={`/eventos/${evento.id}`}
              varianteInscribir="primario"
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
