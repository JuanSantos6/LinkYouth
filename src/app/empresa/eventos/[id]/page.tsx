import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvisoDeResultado } from "@/components/empresa/AvisoDeResultado";
import { ComoLlegar } from "@/components/eventos/ComoLlegar";
import { MapaInteractivo } from "@/components/mapa/MapaInteractivo";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonEnlace } from "@/components/ui/Boton";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FotoConCredito } from "@/components/ui/FotoConCredito";
import { Insignia } from "@/components/ui/Insignia";
import { cancelarEvento } from "@/lib/acciones/eventosDeEmpresa";
import { obtenerEventoDeEmpresa, obtenerInscriptos } from "@/lib/data/empresa";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";
import { fechaLarga, hora, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Evento" };
export const dynamic = "force-dynamic";

/**
 * Un evento propio (RF4): cuándo y dónde es, con su mapa y «Cómo llegar»,
 * quiénes se inscribieron y, mientras no haya pasado, editarlo o cancelarlo
 * (RF4.2, RF4.3). Cancelar les avisa a los inscriptos desde la base (RF4.3.2).
 */
export default async function PaginaEvento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; falto?: string }>;
}) {
  const [{ id }, { guardado, falto }] = await Promise.all([
    params,
    searchParams,
  ]);

  const resultado = await obtenerEventoDeEmpresa(id);
  if (!resultado) notFound();
  const evento = resultado.datos;
  const esEjemplo = resultado.origen === "ejemplo";

  const inscriptos = await obtenerInscriptos(evento.id);
  const momento = ReglasDeEvento.momento(evento);
  const modificable = ReglasDeEvento.puedeModificar(evento);
  const conMapa = ReglasDeEvento.tieneUbicacion(evento);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/empresa/eventos"
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← Mis eventos
      </Link>

      {guardado && !falto && (
        <AvisoDeResultado>Listo: el evento quedó guardado.</AvisoDeResultado>
      )}
      {guardado && falto && (
        <AvisoDeResultado tono="error">
          El evento se guardó, pero faltó {falto}. Probá de nuevo desde Editar.
        </AvisoDeResultado>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[32px]">
            {evento.titulo}
          </h1>
          {momento === "cancelado" && (
            <Insignia tono="apagado">Cancelado</Insignia>
          )}
          {momento === "pasado" && <Insignia tono="neutro">Ya pasó</Insignia>}
        </div>
        <p className="text-[15.5px] text-tinta">
          <time dateTime={evento.fecha_hora}>
            {fechaLarga(evento.fecha_hora)}
          </time>
          , {hora(evento.fecha_hora)}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[14.5px] text-apagado">
            {evento.direccion ?? "Sin dirección cargada"}
          </span>
          <ComoLlegar evento={evento} />
        </div>

        {modificable && (
          <div className="flex flex-wrap items-start gap-2 pt-1">
            <BotonEnlace href={`/empresa/eventos/${evento.id}/editar`}>
              Editar
            </BotonEnlace>
            <BotonConfirmado
              accion={cancelarEvento}
              campos={{ id: evento.id }}
              deshabilitado={esEjemplo}
              textos={{
                inicial: "Cancelar evento",
                pregunta:
                  evento.inscriptos > 0
                    ? `Les avisamos a ${evento.inscriptos === 1 ? "la persona inscripta" : `las ${evento.inscriptos} personas inscriptas`} que el evento no se hace. No se puede deshacer.`
                    : "El evento deja de verse en Eventos. No se puede deshacer.",
                confirmar: "Sí, cancelarlo",
                enCurso: "Cancelando…",
              }}
            />
          </div>
        )}
      </header>

      <AvisoOrigen resultado={resultado} />

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

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <section aria-labelledby="t-inscriptos" className="min-w-0 space-y-4">
          <h2 id="t-inscriptos" className="text-[22px] text-tinta">
            Inscriptos{" "}
            <span className="cifra text-apagado">
              ({inscriptos.datos.length})
            </span>
          </h2>

          {inscriptos.datos.length === 0 ? (
            <EstadoVacio
              ilustracion="personas"
              titulo="Nadie se inscribió todavía"
              descripcion={
                momento === "proximo"
                  ? "Los jóvenes ven el evento en Eventos y se inscriben desde ahí. Cuando lo hagan, aparecen acá."
                  : "Este evento ya no recibe inscripciones."
              }
            />
          ) : (
            <ul className="divide-y divide-filete border-y border-filete">
              {inscriptos.datos.map(({ persona, creada_en }) => {
                const nombre = `${persona.nombre} ${persona.apellido}`;
                return (
                  <li
                    key={persona.id}
                    className="flex items-center gap-3 py-3.5"
                  >
                    <Avatar
                      nombre={nombre}
                      url={persona.foto_url}
                      semilla={persona.id}
                      tamano="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-tinta">
                        {nombre}
                      </span>
                      <span className="block text-[13px] text-apagado">
                        @{persona.nombre_usuario} · {persona.pais}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] text-apagado">
                      se inscribió {tiempoRelativo(creada_en)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside
          aria-labelledby="t-detalle"
          className="h-fit space-y-4 rounded-tarjeta border border-borde bg-superficie p-5"
        >
          <h2 id="t-detalle" className="text-[17px] font-bold text-tinta">
            Lo que publicaste
          </h2>
          <FotoConCredito
            url={evento.imagen_url}
            alt={`Foto del evento ${evento.titulo}`}
            ancho={640}
            alto={360}
            credito={evento.credito}
            className="aspect-[16/9] w-full rounded-ficha"
          />
          <p className="text-[14.5px] leading-relaxed whitespace-pre-line text-tinta">
            {evento.descripcion}
          </p>
          {evento.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Áreas">
              {evento.tags.map((t) => (
                <li key={t.id}>
                  <Etiqueta>{t.nombre}</Etiqueta>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
