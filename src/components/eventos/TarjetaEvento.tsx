import { AccionConCuenta } from "@/components/auth/InvitacionACuenta";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { BotonAccion } from "@/components/ui/BotonAccion";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";

import { cancelarInscripcion, inscribirse } from "@/lib/acciones/eventos";
import type { Evento } from "@/lib/data/tipos";
import { fechaBloque, fechaLarga, hora } from "@/lib/formato";
import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";

/**
 * El botón de inscribirse o cancelar inscripción a un evento (RF4.5, RF4.6),
 * compartido entre la tarjeta del listado y la pantalla de detalle.
 */
export function AccionDeInscripcion({
  eventoId,
  yaInscripto = false,
  esEjemplo = false,
  conSesion = true,
  siguiente = "/eventos",
  varianteInscribir = "secundario",
}: {
  eventoId: string;
  yaInscripto?: boolean;
  esEjemplo?: boolean;
  conSesion?: boolean;
  siguiente?: string;
  varianteInscribir?: "primario" | "secundario";
}) {
  return (
    <>
      {yaInscripto && (
        <p className="text-[13px] font-medium text-tinta">
          <span aria-hidden className="mr-1.5">
            ✓
          </span>
          Estás inscripto
        </p>
      )}

      {/*
       * Un botón u otro, nunca los dos: lo que se puede hacer con este
       * evento depende de si ya estás anotado. `key` los separa a
       * propósito —cada uno tiene su propio `useActionState`, y sin la
       * clave React reutilizaría el estado de uno en el otro, dejando el
       * mensaje de la inscripción colgado debajo del botón de cancelar.
       */}
      {!conSesion && !esEjemplo ? (
        <AccionConCuenta
          etiqueta="Inscribirme"
          siguiente={siguiente}
          variante={varianteInscribir}
        />
      ) : yaInscripto ? (
        <BotonAccion
          key="cancelar"
          accion={cancelarInscripcion}
          campo="eventoId"
          valor={eventoId}
          variante="fantasma"
          esEjemplo={esEjemplo}
          textos={{
            inicial: "Cancelar inscripción",
            enCurso: "Cancelando…",
            hecho: "Cancelaste tu inscripción",
            ejemplo: "Disponible con eventos reales",
          }}
        />
      ) : (
        <BotonAccion
          key="inscribir"
          accion={inscribirse}
          campo="eventoId"
          valor={eventoId}
          variante={varianteInscribir}
          esEjemplo={esEjemplo}
          celebrar
          textos={{
            inicial: "Inscribirme",
            enCurso: "Inscribiendo…",
            hecho: "Ya te inscribiste",
            ejemplo: "Disponible con eventos reales",
          }}
        />
      )}
    </>
  );
}

/**
 * Tarjeta de evento institucional.
 *
 * Toda la tarjeta lleva al detalle del evento (`/eventos/<id>`), como en
 * `FilaVacante`, y el enlace a la organización y el botón de inscribirse
 * quedan por encima (`z-10`).
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
  conSesion = true,
}: {
  evento: Evento;
  yaInscripto?: boolean;
  /** El evento salió de `ejemplos.ts`: no hay nada a lo que inscribirse. */
  esEjemplo?: boolean;
  /** Sin sesión, «Inscribirme» lleva a crear la cuenta y vuelve a `/eventos`. */
  conSesion?: boolean;
}) {
  const { dia, mes } = fechaBloque(evento.fecha_hora);
  const detalle = `/eventos/${evento.id}`;

  return (
    <Tarjeta
      como="article"
      className="group relative overflow-hidden transition-[border-color,box-shadow] duration-200 hover:border-borde-control hover:shadow-elevada"
    >
      {evento.imagen_url && (
        // La imagen del evento vive en Supabase Storage, fuera del optimizador.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={rutaDeImagen(evento.imagen_url) ?? undefined}
          alt=""
          className="h-36 w-full border-b border-borde object-cover"
        />
      )}

      <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
        <div className="flex h-[68px] w-16 shrink-0 flex-col items-center justify-center rounded-ficha bg-lavanda">
          <span className="cifra text-[28px] text-tinta">{dia}</span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-acento">
            {mes}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-tinta">
            <EnlaceTransicion
              href={`/organizaciones/${evento.empresa.id}`}
              className="relative z-10 underline-offset-4 hover:text-acento hover:underline"
            >
              {evento.empresa.razon_social}
            </EnlaceTransicion>
          </p>

          <h3 className="mt-0.5 text-[18px] leading-snug text-tinta sm:text-[19px]">
            <EnlaceTransicion
              href={detalle}
              className="rounded-sm after:absolute after:inset-0 after:rounded-tarjeta after:content-[''] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4"
            >
              {evento.titulo}
            </EnlaceTransicion>
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

          {evento.direccion && (
            <p className="mt-1.5 text-[13px] text-apagado">
              {evento.direccion}
            </p>
          )}

          {evento.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {evento.tags.map((tag) => (
                <li key={tag}>
                  <Etiqueta>{tag}</Etiqueta>
                </li>
              ))}
            </ul>
          )}

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-start gap-x-4 gap-y-2 sm:justify-end">
            <AccionDeInscripcion
              eventoId={evento.id}
              yaInscripto={yaInscripto}
              esEjemplo={esEjemplo}
              conSesion={conSesion}
              siguiente="/eventos"
              varianteInscribir="secundario"
            />
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}
