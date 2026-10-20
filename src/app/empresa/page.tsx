import type { Metadata } from "next";
import Link from "next/link";

import { Coincidencia } from "@/components/empresa/Coincidencia";
import { Encabezado } from "@/components/layout/Encabezado";
import { Avatar } from "@/components/ui/Avatar";
import { Aviso, AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonEnlace } from "@/components/ui/Boton";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { obtenerPanelDeEmpresa } from "@/lib/data/empresa";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";
import { ResumenDePanel } from "@/lib/dominio/ResumenDePanel";
import { fechaBloque, fechaLarga, hora, tiempoRelativo } from "@/lib/formato";

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
 * Panel de empresa (RF7): lo que pide atención hoy. Cuántas búsquedas están
 * activas y cuántas personas se postularon sin que nadie las mirara, los
 * postulantes que más declaran de lo que se pide y los próximos eventos.
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
    <div className="space-y-10">
      <Encabezado
        titulo={`Hola, ${empresa.razon_social}`}
        descripcion="Lo que pide tu atención hoy en LinkYouth."
        acciones={
          <>
            <BotonEnlace href="/empresa/eventos/nuevo">
              Crear evento
            </BotonEnlace>
            <BotonEnlace href="/empresa/busquedas/nueva" variante="primario">
              Publicar búsqueda
            </BotonEnlace>
          </>
        }
      />

      <AvisoOrigen resultado={resultado} />

      {falta.length > 0 && (
        <Aviso titulo="Tu perfil está incompleto">
          Los jóvenes miran quién publica antes de postularse. Sumá{" "}
          {new Intl.ListFormat("es", { type: "conjunction" }).format(falta)}{" "}
          desde{" "}
          <Link
            href="/empresa/perfil"
            className="font-medium text-acento underline underline-offset-4"
          >
            el perfil de la empresa
          </Link>
          .
        </Aviso>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricas.map(({ valor, texto, href }) => (
          <li key={texto}>
            <Link
              href={href}
              className="block h-full rounded-tarjeta border border-borde bg-superficie px-5 py-4 transition-shadow duration-150 hover:shadow-elevada"
            >
              <span className="cifra block text-[34px] text-tinta">
                {valor}
              </span>
              <span className="mt-1 block text-[14px] text-apagado">
                {texto}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="t-recomendados" className="space-y-4">
        <TituloDeBloque
          id="t-recomendados"
          titulo="Postulantes recomendados"
          href="/empresa/candidatos"
          enlace="Ver todos los candidatos"
        />
        <p className="-mt-2 text-[14px] text-apagado">
          Entre quienes se postularon a tus búsquedas activas y siguen en
          proceso, los que declaran más de las habilidades que pedís.
        </p>

        {recomendados.length === 0 ? (
          <EstadoVacio
            ilustracion="personas"
            titulo={
              activas.length === 0
                ? "Sin búsquedas activas no hay a quién recomendar"
                : "Todavía no hay postulantes para recomendar"
            }
            descripcion={
              activas.length === 0
                ? "Publicá una búsqueda con las habilidades que pedís y acá vas a ver primero a quienes más declaran de ellas."
                : "Cuando alguien que declara al menos una de las habilidades que pedís se postule, aparece acá."
            }
            accion={
              activas.length === 0 ? (
                <Link
                  href="/empresa/busquedas/nueva"
                  className="text-[14px] font-medium text-acento hover:underline"
                >
                  Publicar una búsqueda
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recomendados.map(({ postulacion, busqueda, coincidencia }) => {
              const persona = postulacion.persona!;
              const nombre = `${persona.nombre} ${persona.apellido}`;
              const estado = new EstadoParaEmpresa(postulacion.estado);
              return (
                <li
                  key={postulacion.id}
                  className="relative flex gap-4 rounded-tarjeta border border-borde bg-superficie p-5 transition-shadow duration-150 hover:shadow-elevada"
                >
                  <Avatar
                    nombre={nombre}
                    url={persona.foto_url}
                    semilla={persona.id}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[17px] font-semibold text-tinta">
                        <Link
                          href={`/empresa/busquedas/${busqueda.id}/postulantes/${postulacion.id}`}
                          className="underline-offset-4 after:absolute after:inset-0 hover:underline"
                        >
                          {nombre}
                        </Link>
                      </h3>
                      <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
                    </div>
                    <p className="text-[13.5px] text-apagado">
                      Se postuló a «{busqueda.titulo}»{" "}
                      {tiempoRelativo(postulacion.creada_en)}
                    </p>
                    <Coincidencia coincidencia={coincidencia} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="t-busquedas" className="space-y-4">
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
                  ? "Publicá la primera: tarda unos minutos y la ven los jóvenes apenas la guardás."
                  : "Las que tenés están pausadas o cerradas. Podés reactivar una pausada desde Mis búsquedas."
              }
            />
          ) : (
            <ul className="divide-y divide-filete border-y border-filete">
              {activas.map((busqueda) => (
                <li
                  key={busqueda.id}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/empresa/busquedas/${busqueda.id}`}
                      className="block truncate text-[15.5px] font-semibold text-tinta underline-offset-4 hover:underline"
                    >
                      {busqueda.titulo}
                    </Link>
                    <span className="block text-[13px] text-apagado">
                      {busqueda.postulaciones}{" "}
                      {busqueda.postulaciones === 1
                        ? "postulación"
                        : "postulaciones"}{" "}
                      · publicada {tiempoRelativo(busqueda.creada_en)}
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

        <section aria-labelledby="t-eventos" className="space-y-4">
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
              descripcion="Una charla o un taller es la forma más directa de que te conozcan antes de postularse."
              accion={
                <Link
                  href="/empresa/eventos/nuevo"
                  className="text-[14px] font-medium text-acento hover:underline"
                >
                  Crear un evento
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {proximos.map((evento) => {
                const { dia, mes } = fechaBloque(evento.fecha_hora);
                return (
                  <li
                    key={evento.id}
                    className="relative flex items-center gap-4 rounded-tarjeta border border-borde bg-superficie p-4 transition-shadow duration-150 hover:shadow-elevada"
                  >
                    <span className="flex h-[60px] w-14 shrink-0 flex-col items-center justify-center rounded-ficha bg-lavanda">
                      <span className="cifra text-[24px] text-tinta">
                        {dia}
                      </span>
                      <span className="mt-1 text-[11px] font-bold tracking-wide text-acento uppercase">
                        {mes}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={`/empresa/eventos/${evento.id}`}
                        className="block font-semibold text-tinta underline-offset-4 after:absolute after:inset-0 hover:underline"
                      >
                        {evento.titulo}
                      </Link>
                      <span className="block text-[13.5px] text-apagado">
                        <time dateTime={evento.fecha_hora}>
                          {fechaLarga(evento.fecha_hora)}
                        </time>
                        , {hora(evento.fecha_hora)} · {evento.inscriptos}{" "}
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
