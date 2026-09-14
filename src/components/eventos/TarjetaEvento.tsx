import { BotonAccion } from "@/components/ui/BotonAccion";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { inscribirse } from "@/lib/acciones/eventos";
import type { Evento } from "@/lib/data/tipos";
import { fechaBloque, fechaLarga, hora } from "@/lib/formato";

/**
 * Tarjeta de evento institucional.
 *
 * Los eventos sí son tarjetas —tienen imagen y fecha propias— y las vacantes
 * no. Esa diferencia de forma es intencional: hay que distinguir de un vistazo
 * una oferta de trabajo de una actividad.
 *
 * Cuando el evento no trae imagen no se inventa una banda de color de relleno:
 * el bloque de fecha pasa a ser el ancla visual, que es lo que de verdad
 * distingue a un evento del resto del feed.
 *
 * Sin cupos ni conteo de inscriptos: el esquema no guarda cupo, y la política
 * de `inscripciones_evento` no deja contar las de los demás.
 */
export function TarjetaEvento({
  evento,
  yaInscripto = false,
  esEjemplo = false,
}: {
  evento: Evento;
  yaInscripto?: boolean;
  /** El evento salió de `ejemplos.ts`: no hay nada a lo que inscribirse. */
  esEjemplo?: boolean;
}) {
  const { dia, mes } = fechaBloque(evento.fecha_hora);

  return (
    <Tarjeta como="article" className="overflow-hidden">
      {evento.imagen_url && (
        // La imagen del evento vive en Supabase Storage, fuera del optimizador.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={evento.imagen_url}
          alt=""
          className="h-36 w-full border-b border-borde object-cover"
        />
      )}

      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-ficha border border-borde bg-realce">
          <span className="cifra text-[26px] text-tinta">{dia}</span>
          <span className="mt-1 text-[11px] font-medium text-apagado">
            {mes}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-tinta">
            {evento.empresa.razon_social}
          </p>

          <h3 className="mt-0.5 text-[18px] text-tinta sm:text-[19px]">
            {evento.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-apagado">
            {evento.descripcion}
          </p>

          <p className="mt-3 text-[13px] text-apagado">
            <time dateTime={evento.fecha_hora}>
              {fechaLarga(evento.fecha_hora)}
            </time>
            <span className="ml-4">{hora(evento.fecha_hora)}</span>
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

          <div className="mt-4 flex justify-start sm:justify-end">
            <BotonAccion
              accion={inscribirse}
              campo="eventoId"
              valor={evento.id}
              variante="secundario"
              hecho={yaInscripto}
              esEjemplo={esEjemplo}
              textos={{
                inicial: "Inscribirme",
                enCurso: "Inscribiendo…",
                hecho: "Ya te inscribiste",
                ejemplo: "Disponible con eventos reales",
              }}
            />
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}
