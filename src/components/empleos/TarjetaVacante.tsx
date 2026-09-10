import { Avatar } from "@/components/ui/Avatar";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { Vacante } from "@/lib/data/tipos";
import { afinidad, etiquetaTipo, tiempoRelativo } from "@/lib/formato";

import { BotonPostularse } from "./BotonPostularse";

/**
 * Tarjeta de una oportunidad laboral.
 *
 * El orden de lectura sigue las preguntas de quien busca trabajo: quién
 * ofrece, qué puesto, qué piden y cómo postularse. Los requisitos se muestran
 * en dos grupos porque `db/schema.sql` los separa: `vacante_tags_publicos` son
 * los intereses de la búsqueda y `vacante_habilidades` los conocimientos
 * técnicos.
 *
 * Los tags ocultos de la vacante (RF3.1.6, RNF5) no llegan hasta acá: la
 * política de RLS ya se los niega a cualquier sesión que no sea la empresa.
 */
export function TarjetaVacante({
  vacante,
  tagsPerfil = [],
  habilidadesPerfil = [],
  yaPostulado = false,
}: {
  vacante: Vacante;
  tagsPerfil?: string[];
  habilidadesPerfil?: string[];
  yaPostulado?: boolean;
}) {
  const requisitos = [...vacante.tags, ...vacante.habilidades];
  const declarados = [...tagsPerfil, ...habilidadesPerfil];
  const compatibilidad = afinidad(requisitos, declarados);

  const propios = new Set(declarados.map((nombre) => nombre.toLowerCase()));
  const tono = (nombre: string) =>
    propios.has(nombre.toLowerCase()) ? "coincide" : "neutra";

  return (
    <Tarjeta como="article" interactiva className="p-5">
      <div className="flex items-start gap-4">
        <Avatar
          nombre={vacante.empresa.razon_social}
          url={vacante.empresa.logo_url}
          forma="cuadrado"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tinta-suave">
            <span className="font-semibold text-tinta-media">
              {vacante.empresa.razon_social}
            </span>
            <span aria-hidden="true">·</span>
            <span>{vacante.empresa.rubro}</span>
            <span aria-hidden="true">·</span>
            <span>{tiempoRelativo(vacante.creada_en)}</span>
          </div>

          <h3 className="mt-1 text-base font-bold text-tinta">
            {vacante.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tinta-media">
            {vacante.descripcion}
          </p>
        </div>

        {requisitos.length > 0 && (
          <div className="hidden shrink-0 text-right sm:block">
            <Insignia tono={compatibilidad >= 70 ? "exito" : "neutro"}>
              {compatibilidad}% compatible
            </Insignia>
          </div>
        )}
      </div>

      {vacante.habilidades.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
            Habilidades
          </h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {vacante.habilidades.map((habilidad) => (
              <li key={habilidad}>
                <Etiqueta tono={tono(habilidad)}>{habilidad}</Etiqueta>
              </li>
            ))}
          </ul>
        </div>
      )}

      {vacante.tags.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
            Áreas de interés
          </h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {vacante.tags.map((tag) => (
              <li key={tag}>
                <Etiqueta tono={tono(tag)}>{tag}</Etiqueta>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-borde pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Insignia tono={vacante.tipo === "pasantia" ? "primario" : "neutro"}>
            {etiquetaTipo(vacante.tipo)}
          </Insignia>
          <span className="text-xs text-tinta-suave">
            {vacante.posiciones === 1
              ? "1 posición"
              : `${vacante.posiciones} posiciones`}
          </span>
        </div>

        <BotonPostularse vacanteId={vacante.id} yaPostulado={yaPostulado} />
      </div>
    </Tarjeta>
  );
}
