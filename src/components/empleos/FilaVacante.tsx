import { AccionConCuenta } from "@/components/auth/InvitacionACuenta";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { Avatar } from "@/components/ui/Avatar";
import { BotonAccion } from "@/components/ui/BotonAccion";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { postularse } from "@/lib/acciones/postulaciones";
import type { EntradaDelFeed } from "@/lib/dominio/FeedDeVacantes";
import { ETIQUETA_MODALIDAD } from "@/lib/dominio/ReglasDeBusqueda";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

/**
 * Una vacante del listado, como tarjeta.
 *
 * Toda la tarjeta lleva al detalle (el título se estira sobre ella), y el
 * botón de postularse queda por encima, clickeable aparte. Hover solo porque
 * de verdad lleva a algún lado.
 *
 * Muestra lo que la vacante pide, sin marcar qué de eso tiene quien mira: la
 * compatibilidad y las coincidencias son solo para la empresa (RF3.9.2). Sin
 * sesión, «Postularme» lleva a crear la cuenta y vuelve al detalle.
 */
export function FilaVacante({
  entrada,
  yaPostulado = false,
  esEjemplo = false,
  conSesion = true,
}: {
  entrada: EntradaDelFeed;
  yaPostulado?: boolean;
  /** La vacante salió de `ejemplos.ts`: no existe nada a lo que postularse. */
  esEjemplo?: boolean;
  conSesion?: boolean;
}) {
  const { vacante } = entrada;
  const detalle = `/empleos/${vacante.id}`;

  return (
    <article className="group relative grid gap-4 rounded-tarjeta border border-borde bg-superficie p-5 transition-[border-color,box-shadow] duration-200 hover:border-borde-control hover:shadow-elevada sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
      <div className="flex min-w-0 gap-4">
        <Avatar
          nombre={vacante.empresa.razon_social}
          url={vacante.empresa.logo_url}
          semilla={vacante.empresa.id}
          forma="cuadrado"
        />

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-apagado">
            <span className="font-semibold text-tinta">
              {vacante.empresa.razon_social}
            </span>
            <span>{vacante.empresa.rubro}</span>
            <span>{tiempoRelativo(vacante.creada_en)}</span>
          </p>

          <h3 className="mt-1 text-[19px] leading-snug text-tinta">
            <EnlaceTransicion
              href={detalle}
              className="rounded-sm after:absolute after:inset-0 after:rounded-tarjeta after:content-[''] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4"
            >
              {vacante.titulo}
            </EnlaceTransicion>
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[14.5px] leading-relaxed text-apagado">
            {vacante.descripcion}
          </p>

          {(vacante.habilidades.length > 0 || vacante.tags.length > 0) && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[...vacante.habilidades, ...vacante.tags].map((requisito) => (
                <li key={requisito}>
                  <Etiqueta>{requisito}</Etiqueta>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-apagado">
            <Insignia tono={vacante.tipo === "pasantia" ? "acento" : "neutro"}>
              {etiquetaTipo(vacante.tipo)}
            </Insignia>
            {vacante.modalidad && (
              <span>{ETIQUETA_MODALIDAD[vacante.modalidad]}</span>
            )}
            {vacante.ubicacion && <span>{vacante.ubicacion}</span>}
            <span>
              {vacante.posiciones === 1
                ? "1 posición"
                : `${vacante.posiciones} posiciones`}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-end sm:w-44 sm:flex-col sm:items-stretch sm:justify-end">
        {conSesion || esEjemplo ? (
          <BotonAccion
            accion={postularse}
            campo="vacanteId"
            valor={vacante.id}
            hecho={yaPostulado}
            esEjemplo={esEjemplo}
            celebrar
            variante="secundario"
            textos={{
              inicial: "Postularme",
              enCurso: "Enviando…",
              hecho: "Ya te postulaste",
              ejemplo: "Disponible con vacantes reales",
            }}
          />
        ) : (
          <AccionConCuenta
            etiqueta="Postularme"
            siguiente={detalle}
            variante="secundario"
          />
        )}
      </div>
    </article>
  );
}
