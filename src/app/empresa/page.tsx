import type { Metadata } from "next";
import Link from "next/link";

import { Coincidencia } from "@/components/empresa/Coincidencia";
import { AvisoDeImagenFallida } from "@/components/perfil/AvisoDeImagenFallida";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonEnlace } from "@/components/ui/Boton";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { obtenerPanelDeEmpresa } from "@/lib/data/empresa";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";
import { ResumenDePanel } from "@/lib/dominio/ResumenDePanel";
import { fechaBloque, hora, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Panel de empresa" };
export const dynamic = "force-dynamic";

/** Encabezado de cada bloque del panel, con el enlace a la pantalla entera. */
function TituloDeBloque({
  id,
  titulo,
  href,
  enlace,
}: {
  id: string;
  titulo: string;
  href: string;
  enlace: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="text-[22px] text-tinta">
        {titulo}
      </h2>
      <Link
        href={href}
        className="text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        {enlace}
      </Link>
    </div>
  );
}

/**
 * Panel de empresa (RF7), en orden de importancia y pensado primero para el
 * teléfono: el saludo con las dos acciones principales; las cifras en
 * tarjetas compactas; lo que pide atención («Para revisar»: las
 * postulaciones nuevas); y al final el resto (los que más declaran, las
 * búsquedas activas y los próximos eventos). Un título por bloque y casi
 * nada de texto de ayuda.
 *
 * Qué cuenta como «nuevo», «próximo» o «recomendado» lo decide
 * `ResumenDePanel`. Los recomendados salen solo de los postulantes propios
 * (decisión de la Etapa 2, ver `docs/decisiones.md`).
 */
export default async function PaginaEmpresa() {
  const resultado = await obtenerPanelDeEmpresa();
  const panel = resultado.datos;
  const resumen = new ResumenDePanel(panel);
  const { empresa } = panel;

  const activas = resumen.busquedasActivas;
  const nuevos = resumen.nuevosParaRevisar();
  const recomendados = resumen.recomendados;
  const proximos = resumen.eventosProximos.slice(0, 3);
  const falta = resumen.faltaEnElPerfil;

  const metricas = [
    {
      valor: activas.length,
      texto: activas.length === 1 ? "búsqueda activa" : "búsquedas activas",
      href: "/empresa/busquedas?estado=activa",
    },
    {
      valor: resumen.postulantesNuevos,
      texto:
        resumen.postulantesNuevos === 1
          ? "postulante nuevo"
          : "postulantes nuevos",
      href: "/empresa/candidatos",
    },
    {
      valor: resumen.posicionesAbiertas,
      texto:
        resumen.posicionesAbiertas === 1
          ? "posición abierta"
          : "posiciones abiertas",
      href: "/empresa/busquedas?estado=activa",
    },
    {
      valor: resumen.eventosProximos.length,
      texto:
        resumen.eventosProximos.length === 1
          ? "evento próximo"
          : "eventos próximos",
      href: "/empresa/eventos",
    },
  ];

  return (
    <div className="space-y-12">
      <AvisoDeImagenFallida area="empresa" />
      <header className="space-y-5">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[32px]">
            Hola, {empresa.razon_social}
          </h1>
          <p className="mt-1.5 text-[15px] text-apagado">
            {resumen.postulantesNuevos === 0
              ? "Estás al día con tus postulantes."
              : resumen.postulantesNuevos === 1
                ? "Tenés 1 postulante nuevo para revisar."
                : `Tenés ${resumen.postulantesNuevos} postulantes nuevos para revisar.`}
          </p>
        </div>
        <div className="grid gap-2.5 sm:flex sm:flex-wrap">
          <BotonEnlace
            href="/empresa/busquedas/nueva"
            variante="primario"
            className="w-full sm:w-auto"
          >
            Publicar búsqueda
          </BotonEnlace>
          <BotonEnlace
            href="/empresa/eventos/nuevo"
            className="w-full sm:w-auto"
          >
            Crear evento
          </BotonEnlace>
        </div>
      </header>

      <AvisoOrigen resultado={resultado} />

      <section aria-label="Tus números">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricas.map(({ valor, texto, href }) => (
            <li key={texto}>
              <Link
                href={href}
                className="block h-full rounded-tarjeta border border-borde bg-superficie px-4 py-3.5 transition-shadow duration-150 hover:shadow-elevada"
              >
                <span className="cifra block text-[30px] leading-none text-tinta">
                  {valor}
                </span>
                <span className="mt-1.5 block text-[13px] leading-snug text-apagado">
                  {texto}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-revisar" className="space-y-4">
        <TituloDeBloque
          id="t-revisar"
          titulo="Para revisar"
          href="/empresa/candidatos"
          enlace="Ver todos"
        />

        {nuevos.length === 0 ? (
          <p className="rounded-tarjeta border border-dashed border-borde-control/70 bg-superficie px-5 py-6 text-center text-[14.5px] text-apagado">
            {activas.length === 0
              ? "Cuando publiques una búsqueda, quienes se postulen aparecen acá."
              : "No hay postulantes nuevos. Te avisamos cuando llegue alguien."}
          </p>
        ) : (
          <ul className="divide-y divide-filete overflow-hidden rounded-tarjeta border border-borde bg-superficie">
            {nuevos.map(({ postulacion, busqueda }) => {
              const persona = postulacion.persona!;
              const nombre = `${persona.nombre} ${persona.apellido}`;
              return (
                <li
                  key={postulacion.id}
                  className="relative flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-realce"
                >
                  <Avatar
                    nombre={nombre}
                    url={persona.foto_url}
                    semilla={persona.id}
                    tamano="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/empresa/busquedas/${busqueda.id}/postulantes/${postulacion.id}`}
                      className="block truncate text-[15px] font-semibold text-tinta after:absolute after:inset-0"
                    >
                      {nombre}
                    </Link>
                    <span className="block truncate text-[13px] text-apagado">
                      {busqueda.titulo} ·{" "}
                      {tiempoRelativo(postulacion.creada_en)}
                    </span>
                  </span>
                  <Insignia tono="acento">Nueva</Insignia>
                </li>
              );
            })}
          </ul>
        )}

        {falta.length > 0 && (
          <p className="text-[14px] text-apagado">
            A tu perfil le falta{" "}
            {new Intl.ListFormat("es", { type: "conjunction" }).format(falta)}.{" "}
            <Link
              href="/empresa/perfil"
              className="font-medium text-acento underline-offset-4 hover:underline"
            >
              Completar el perfil
            </Link>
          </p>
        )}
      </section>

      {recomendados.length > 0 && (
        <section aria-labelledby="t-recomendados" className="space-y-4">
          <TituloDeBloque
            id="t-recomendados"
            titulo="Los que más declaran"
            href="/empresa/candidatos"
            enlace="Candidatos"
          />
          <ul className="grid gap-3 md:grid-cols-2">
            {recomendados.map(({ postulacion, busqueda, coincidencia }) => {
              const persona = postulacion.persona!;
              const nombre = `${persona.nombre} ${persona.apellido}`;
              const estado = new EstadoParaEmpresa(postulacion.estado);
              return (
                <li
                  key={postulacion.id}
                  className="relative flex gap-3 rounded-tarjeta border border-borde bg-superficie p-4 transition-shadow duration-150 hover:shadow-elevada"
                >
                  <Avatar
                    nombre={nombre}
                    url={persona.foto_url}
                    semilla={persona.id}
                    tamano="sm"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 truncate text-[15.5px] font-semibold text-tinta">
                        <Link
                          href={`/empresa/busquedas/${busqueda.id}/postulantes/${postulacion.id}`}
                          className="after:absolute after:inset-0"
                        >
                          {nombre}
                        </Link>
                      </h3>
                      <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
                    </div>
                    <p className="truncate text-[13px] text-apagado">
                      {busqueda.titulo}
                    </p>
                    <Coincidencia coincidencia={coincidencia} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
        <section aria-labelledby="t-busquedas" className="min-w-0 space-y-4">
          <TituloDeBloque
            id="t-busquedas"
            titulo="Búsquedas activas"
            href="/empresa/busquedas"
            enlace="Mis búsquedas"
          />

          {activas.length === 0 ? (
            <EstadoVacio
              ilustracion="busquedas"
              titulo="No tenés búsquedas activas"
              descripcion={
                panel.busquedas.length === 0
                  ? "Publicá la primera: la ven los jóvenes apenas la guardás."
                  : "Podés reactivar una pausada desde Mis búsquedas."
              }
            />
          ) : (
            <ul className="divide-y divide-filete overflow-hidden rounded-tarjeta border border-borde bg-superficie">
              {activas.map((busqueda) => (
                <li
                  key={busqueda.id}
                  className="relative flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-realce"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/empresa/busquedas/${busqueda.id}`}
                      className="block truncate text-[15px] font-semibold text-tinta after:absolute after:inset-0"
                    >
                      {busqueda.titulo}
                    </Link>
                    <span className="block text-[13px] text-apagado">
                      {busqueda.postulaciones}{" "}
                      {busqueda.postulaciones === 1
                        ? "postulación"
                        : "postulaciones"}
                    </span>
                  </span>
                  {busqueda.nuevas > 0 && (
                    <Insignia tono="acento">
                      {busqueda.nuevas}{" "}
                      {busqueda.nuevas === 1 ? "nueva" : "nuevas"}
                    </Insignia>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="t-eventos" className="min-w-0 space-y-4">
          <TituloDeBloque
            id="t-eventos"
            titulo="Próximos eventos"
            href="/empresa/eventos"
            enlace="Mis eventos"
          />

          {proximos.length === 0 ? (
            <EstadoVacio
              ilustracion="eventos"
              titulo="No tenés eventos próximos"
              descripcion="Una charla o un taller es la forma más directa de que te conozcan."
            />
          ) : (
            <ul className="space-y-3">
              {proximos.map((evento) => {
                const { dia, mes } = fechaBloque(evento.fecha_hora);
                return (
                  <li
                    key={evento.id}
                    className="relative flex items-center gap-3 rounded-tarjeta border border-borde bg-superficie p-3 transition-shadow duration-150 hover:shadow-elevada"
                  >
                    <span className="flex h-[52px] w-12 shrink-0 flex-col items-center justify-center rounded-ficha bg-lavanda">
                      <span className="cifra text-[20px] leading-none text-tinta">
                        {dia}
                      </span>
                      <span className="mt-1 text-[10.5px] font-bold tracking-wide text-acento uppercase">
                        {mes}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={`/empresa/eventos/${evento.id}`}
                        className="block truncate text-[15px] font-semibold text-tinta after:absolute after:inset-0"
                      >
                        {evento.titulo}
                      </Link>
                      <span className="block text-[13px] text-apagado">
                        {hora(evento.fecha_hora)} · {evento.inscriptos}{" "}
                        {evento.inscriptos === 1 ? "inscripto" : "inscriptos"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
