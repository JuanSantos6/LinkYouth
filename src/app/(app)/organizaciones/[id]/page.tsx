import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListadoDeVacantes } from "@/components/empleos/ListadoDeVacantes";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { FormularioDeResenia } from "@/components/resenias/FormularioDeResenia";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Estrellas } from "@/components/ui/Estrellas";
import { Tarjeta } from "@/components/ui/Tarjeta";
import {
  obtenerPerfilActual,
  obtenerTipoCuenta,
  obtenerUsuarioId,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";
import { obtenerOrganizacion } from "@/lib/data/publico";
import { FeedDeVacantes } from "@/lib/dominio/FeedDeVacantes";
import { ResumenDeResenias } from "@/lib/dominio/ResumenDeResenias";
import { tiempoRelativo } from "@/lib/formato";
import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resultado = await obtenerOrganizacion(id);

  return { title: resultado.datos?.razon_social ?? "Organización" };
}

/**
 * RF2.5, RF8.1 y RF8.2 — Perfil público de una empresa: sus datos, sus
 * búsquedas activas y las reseñas anónimas que recibió, con el formulario para
 * dejar una si quien mira ya se postuló y todavía no la reseñó.
 */
export default async function PaginaOrganizacion({ params }: Props) {
  const { id } = await params;

  const usuarioId = (await obtenerUsuarioId()) ?? undefined;
  const conSesion = usuarioId !== undefined;

  const [resultado, tipoCuenta, yaPostuladas] = await Promise.all([
    obtenerOrganizacion(id),
    conSesion ? obtenerTipoCuenta(usuarioId) : null,
    conSesion
      ? obtenerVacantesPostuladas(usuarioId)
      : Promise.resolve(new Set<string>()),
  ]);

  if (!resultado.datos) notFound();

  const organizacion = resultado.datos;
  const perfil =
    tipoCuenta === "individual" && usuarioId
      ? (await obtenerPerfilActual(usuarioId)).datos
      : undefined;

  const feed = FeedDeVacantes.armar(organizacion.vacantes, perfil);
  const resumen = new ResumenDeResenias(organizacion.resenias);
  const logo = rutaDeImagen(organizacion.logo_url);

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      <EnlaceTransicion
        href="/empleos"
        className="inline-flex rounded-control px-1 py-1 text-[14px] font-medium text-apagado transition-colors duration-150 hover:text-tinta"
      >
        <span aria-hidden="true">←&nbsp;</span>Búsquedas abiertas
      </EnlaceTransicion>

      <AvisoOrigen resultado={resultado} />

      <Tarjeta como="header" className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar
            nombre={organizacion.razon_social}
            url={logo}
            tamano="lg"
            forma="cuadrado"
          />

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[32px]">
                {organizacion.razon_social}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-apagado">
                <span>{organizacion.rubro}</span>
                {organizacion.sitio_web && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={organizacion.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-acento underline-offset-4 hover:underline"
                    >
                      {organizacion.sitio_web.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
              </p>
            </div>

            {organizacion.descripcion && (
              <p className="max-w-[65ch] text-[15px] leading-relaxed whitespace-pre-line text-tinta">
                {organizacion.descripcion}
              </p>
            )}
          </div>
        </div>
      </Tarjeta>

      <section aria-labelledby="t-busquedas" className="space-y-4">
        <div className="space-y-1">
          <h2 id="t-busquedas" className="text-[22px] text-tinta">
            Búsquedas activas
          </h2>
          <p className="text-[14px] text-apagado">
            Empleos y pasantías que esta organización tiene abiertos hoy.
          </p>
        </div>

        {feed.vacio ? (
          <EstadoVacio
            titulo="No tiene búsquedas activas en este momento"
            descripcion="Cuando esta organización publique un empleo o una pasantía, la vas a ver acá."
          />
        ) : (
          <ListadoDeVacantes
            feed={feed}
            yaPostuladas={yaPostuladas}
            esEjemplo={resultado.origen === "ejemplo"}
            conSesion={conSesion}
          />
        )}
      </section>

      <section aria-labelledby="t-resenias" className="space-y-5">
        <div className="space-y-1">
          <h2 id="t-resenias" className="text-[22px] text-tinta">
            Reseñas
          </h2>
          <p className="text-[14px] text-apagado">
            Lo que cuentan los jóvenes de su experiencia con esta organización.
            Son anónimas.
          </p>
        </div>

        {organizacion.puedeReseniar && (
          <Tarjeta className="p-5 sm:p-6">
            <div className="mb-4 border-b border-filete pb-3">
              <h3 className="text-[18px] text-tinta">Dejá tu reseña</h3>
              <p className="mt-1 text-[14px] text-apagado">
                Te postulaste a una búsqueda de {organizacion.razon_social}. Tu
                opinión ayuda a otros jóvenes y se publica sin tu nombre.
              </p>
            </div>
            <FormularioDeResenia empresaId={organizacion.id} />
          </Tarjeta>
        )}

        {resumen.total === 0 ? (
          <EstadoVacio
            titulo="Todavía no tiene reseñas"
            descripcion="Las escriben los jóvenes que se postularon a alguna búsqueda de esta empresa. Cuando llegue la primera, la vas a ver acá."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-tarjeta border border-borde bg-superficie p-5">
              <span className="cifra text-[40px] leading-none text-tinta">
                {resumen.promedioTexto}
              </span>
              <span className="space-y-1">
                <Estrellas valor={Math.round(resumen.promedio)} />
                <span className="block text-[14px] text-apagado">
                  Promedio de{" "}
                  {resumen.total === 1
                    ? "1 reseña"
                    : `${resumen.total} reseñas`}
                </span>
              </span>
            </div>

            <ul className="divide-y divide-filete border-y border-filete">
              {organizacion.resenias.map((resenia) => (
                <li key={resenia.id} className="space-y-2 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Estrellas valor={resenia.calificacion} />
                    <span className="text-[13px] text-apagado">
                      {tiempoRelativo(resenia.creada_en)}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed whitespace-pre-line text-tinta">
                    {resenia.comentario}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </article>
  );
}
