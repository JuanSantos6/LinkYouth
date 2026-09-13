import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { Evento } from "@/lib/data/tipos";
import { fechaBloque, fechaLarga, hora } from "@/lib/formato";

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
 * Deliberadamente distinta de la de una vacante: cabecera propia y bloque de
 * fecha destacado. Quien recorre el feed tiene que poder distinguir de un
 * vistazo una oferta de trabajo de una actividad.
 *
 * No muestra cupos ni cantidad de inscriptos: `db/schema.sql` no guarda cupo,
 * y la política de `inscripciones_evento` solo deja ver las propias y las de
 * la empresa organizadora, así que un postulante no puede contar las de los
 * demás.
 */
export function TarjetaEvento({
  evento,
  yaInscripto = false,
  esEjemplo = false,
}: {
  evento: Evento;
  yaInscripto?: boolean;
  /** El evento salió de `ejemplos.ts`, no de la base: no se puede inscribir. */
  esEjemplo?: boolean;
}) {
  const { dia, mes } = fechaBloque(evento.fecha_hora);

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
            width={896}
            height={112}
            loading="lazy"
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
            {evento.empresa.razon_social}
          </p>

          <h3 className="mt-0.5 text-base font-bold text-tinta">
            {evento.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tinta-media">
            {evento.descripcion}
          </p>

          <p className="mt-3 text-xs text-tinta-suave">
            <time dateTime={evento.fecha_hora}>
              {fechaLarga(evento.fecha_hora)}
            </time>{" "}
            · {hora(evento.fecha_hora)}
          </p>

          {evento.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {evento.tags.map((tag) => (
                <li key={tag}>
                  <Etiqueta>{tag}</Etiqueta>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex justify-end border-t border-borde pt-4">
            <BotonInscribirse
              eventoId={evento.id}
              yaInscripto={yaInscripto}
              esEjemplo={esEjemplo}
            />
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}
