import { IconoUbicacion } from "@/components/layout/Iconos";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
// TODO: reconectar contra db/schema.sql
import type { Evento } from "@/lib/data/tipos";
import {
  etiquetaModalidad,
  fechaBloque,
  fechaLarga,
  rangoHorario,
} from "@/lib/formato";

import { BotonInscribirse } from "./BotonInscribirse";

/**
 * Franjas de color de la cabecera cuando el evento no trae imagen.
 *
 * Se elige de forma determinística a partir del id, así el mismo evento se ve
 * siempre igual. Es preferible a una foto de archivo: no promete algo que el
 * evento no es y no agrega peso a la página.
 */
const FRANJAS = [
  "from-[#1d4ed8] to-[#3b82f6]",
  "from-[#0f766e] to-[#14b8a6]",
  "from-[#4338ca] to-[#6366f1]",
  "from-[#b45309] to-[#f59e0b]",
] as const;

function franjaDe(id: string): string {
  const suma = [...id].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return FRANJAS[suma % FRANJAS.length];
}

/**
 * Tarjeta de evento institucional.
 *
 * Deliberadamente distinta de la de una vacante: cabecera propia, bloque de
 * fecha destacado y el cupo como dato principal. Quien recorre el feed tiene
 * que poder distinguir de un vistazo una oferta de trabajo de una actividad.
 */
export function TarjetaEvento({ evento }: { evento: Evento }) {
  const { dia, mes } = fechaBloque(evento.inicia_en);
  const lugaresLibres =
    evento.cupo !== null ? Math.max(evento.cupo - evento.inscriptos, 0) : null;

  return (
    <Tarjeta como="article" interactiva className="overflow-hidden">
      <div
        className={`h-28 overflow-hidden bg-gradient-to-br ${franjaDe(evento.id)}`}
        aria-hidden="true"
      >
        {/* La imagen del evento vive en Supabase Storage, fuera del optimizador. */}
        {evento.imagen_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={evento.imagen_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* `relative` mantiene el bloque de fecha por encima de la cabecera. */}
      <div className="relative flex gap-4 p-5">
        <div className="-mt-12 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-tarjeta border border-borde bg-superficie shadow-elevada">
          <span className="text-xl font-bold leading-none text-primario">
            {dia}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-widest text-tinta-suave">
            {mes}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-tinta-media">
            {evento.empresa}
          </p>

          <h3 className="mt-0.5 text-base font-bold text-tinta">
            {evento.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tinta-media">
            {evento.descripcion}
          </p>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-tinta-suave">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Fecha y hora</dt>
              <dd>
                <time dateTime={evento.inicia_en}>
                  {fechaLarga(evento.inicia_en)}
                </time>{" "}
                · {rangoHorario(evento.inicia_en, evento.termina_en)}
              </dd>
            </div>

            {evento.ubicacion && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Lugar</dt>
                <dd className="flex items-center gap-1.5">
                  <IconoUbicacion className="h-3.5 w-3.5 text-tinta-tenue" />
                  {evento.ubicacion}
                </dd>
              </div>
            )}
          </dl>

          {evento.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {evento.tags.map((tag) => (
                <li key={tag}>
                  <Etiqueta>{tag}</Etiqueta>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-borde pt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Insignia>{etiquetaModalidad(evento.modalidad)}</Insignia>
              {lugaresLibres !== null ? (
                <Insignia tono={lugaresLibres <= 10 ? "aviso" : "neutro"}>
                  {lugaresLibres === 0
                    ? "Sin cupos"
                    : `Quedan ${lugaresLibres} cupos`}
                </Insignia>
              ) : (
                <Insignia>Cupo abierto</Insignia>
              )}
              <span className="text-xs text-tinta-suave">
                {evento.inscriptos} inscriptos
              </span>
            </div>

            <BotonInscribirse eventoId={evento.id} />
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}
