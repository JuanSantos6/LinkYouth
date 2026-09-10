import { IconoUbicacion, IconoVerificado } from "@/components/layout/Iconos";
import { Avatar } from "@/components/ui/Avatar";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { Vacante } from "@/lib/data/tipos";
import {
  afinidad,
  etiquetaModalidad,
  etiquetaTipo,
  rangoSalarial,
  tiempoRelativo,
} from "@/lib/formato";

import { BotonPostularse } from "./BotonPostularse";

/**
 * Tarjeta de una oportunidad laboral.
 *
 * El orden de lectura es el de las preguntas que se hace quien busca trabajo:
 * quién ofrece, qué puesto, qué piden, cuánto paga y cómo postularse. La
 * compatibilidad se muestra solo cuando la vacante declara tags, y siempre
 * acompañada del detalle de cuáles coinciden.
 */
export function TarjetaVacante({
  vacante,
  tagsPerfil = [],
  yaPostulado = false,
}: {
  vacante: Vacante;
  tagsPerfil?: string[];
  yaPostulado?: boolean;
}) {
  const compatibilidad = afinidad(vacante.tags, tagsPerfil);
  const propios = new Set(tagsPerfil.map((tag) => tag.toLowerCase()));
  const salario = rangoSalarial(
    vacante.salario_min,
    vacante.salario_max,
    vacante.moneda,
  );

  return (
    <Tarjeta como="article" interactiva className="p-5">
      <div className="flex items-start gap-4">
        <Avatar
          nombre={vacante.empresa}
          url={vacante.empresa_logo_url}
          forma="cuadrado"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tinta-suave">
            <span className="font-semibold text-tinta-media">
              {vacante.empresa}
            </span>
            {vacante.empresa_verificada && (
              <IconoVerificado className="h-4 w-4 text-primario" />
            )}
            {vacante.ubicacion && (
              <span className="flex items-center gap-1">
                <IconoUbicacion className="h-3.5 w-3.5 text-tinta-tenue" />
                {vacante.ubicacion}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{tiempoRelativo(vacante.publicada_en)}</span>
          </div>

          <h3 className="mt-1 text-base font-bold text-tinta">
            {vacante.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tinta-media">
            {vacante.descripcion}
          </p>
        </div>

        {compatibilidad > 0 && (
          <div className="hidden shrink-0 text-right sm:block">
            <Insignia tono={compatibilidad >= 70 ? "exito" : "neutro"}>
              {compatibilidad}% compatible
            </Insignia>
          </div>
        )}
      </div>

      {vacante.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {vacante.tags.map((tag) => (
            <li key={tag}>
              <Etiqueta
                tono={propios.has(tag.toLowerCase()) ? "coincide" : "neutra"}
              >
                {tag}
              </Etiqueta>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-borde pt-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-tinta">
            {salario ?? "Remuneración a convenir"}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Insignia
              tono={vacante.tipo === "pasantia" ? "primario" : "neutro"}
            >
              {etiquetaTipo(vacante.tipo)}
            </Insignia>
            <Insignia>{etiquetaModalidad(vacante.modalidad)}</Insignia>
            <span className="text-xs text-tinta-suave">
              {vacante.posiciones === 1
                ? "1 posición"
                : `${vacante.posiciones} posiciones`}
            </span>
          </div>
        </div>

        <BotonPostularse vacanteId={vacante.id} yaPostulado={yaPostulado} />
      </div>
    </Tarjeta>
  );
}
