import type { Metadata } from "next";
import Link from "next/link";

import { HabilidadesDeclaradas } from "@/components/empresa/HabilidadesDeclaradas";
import { Encabezado } from "@/components/layout/Encabezado";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { obtenerPostulantesPropios } from "@/lib/data/empresa";
import { BuscadorDeCandidatos } from "@/lib/dominio/BuscadorDeCandidatos";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";

export const metadata: Metadata = { title: "Candidatos" };
export const dynamic = "force-dynamic";

/** El enlace que prende o apaga un interés en el filtro. */
function hrefCon(elegidos: string[], interes: string): string {
  const siguientes = elegidos.includes(interes)
    ? elegidos.filter((i) => i !== interes)
    : [...elegidos, interes];
  if (siguientes.length === 0) return "/empresa/candidatos";
  const params = new URLSearchParams();
  for (const i of siguientes) params.append("interes", i);
  return `/empresa/candidatos?${params}`;
}

/**
 * Candidatos por intereses (RF7.3): las personas que se postularon a alguna
 * búsqueda de la empresa, filtrables por sus intereses. El filtro son
 * enlaces con `searchParams`, así que funciona sin JavaScript.
 */
export default async function PaginaCandidatos({
  searchParams,
}: {
  searchParams: Promise<{ interes?: string | string[] }>;
}) {
  const { interes } = await searchParams;
  const elegidos = [interes ?? []].flat();

  const resultado = await obtenerPostulantesPropios();
  const candidatos = BuscadorDeCandidatos.agrupar(resultado.datos);
  const intereses = BuscadorDeCandidatos.intereses(candidatos);
  const visibles = BuscadorDeCandidatos.filtrar(candidatos, elegidos);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Encabezado
        titulo="Candidatos"
        descripcion="Las personas que se postularon a tus búsquedas, para encontrarlas por sus intereses."
      />

      <AvisoOrigen resultado={resultado} />

      {candidatos.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no tenés candidatos"
          descripcion="Cuando alguien se postule a una de tus búsquedas, aparece acá con sus intereses y sus habilidades declaradas."
          accion={
            <Link
              href="/empresa/busquedas/nueva"
              className="text-[14px] font-medium text-acento hover:underline"
            >
              Publicar una búsqueda
            </Link>
          }
        />
      ) : (
        <>
          <section aria-labelledby="t-filtro" className="space-y-2">
            <h2 id="t-filtro" className="text-[15px] font-semibold text-tinta">
              Filtrar por intereses
            </h2>
            <p className="text-[13.5px] text-apagado">
              Elegí uno o más: quedan quienes tienen todos los elegidos.
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {intereses.map(({ nombre, cuantos }) => {
                const activo = elegidos.includes(nombre);
                return (
                  <li key={nombre}>
                    <Link
                      href={hrefCon(elegidos, nombre)}
                      aria-current={activo ? "true" : undefined}
                      className="inline-flex rounded-full transition-opacity duration-150 hover:opacity-75"
                    >
                      {activo ? (
                        <Etiqueta marcada="filtro activo">
                          {nombre} ({cuantos})
                        </Etiqueta>
                      ) : (
                        <Etiqueta>
                          {nombre} ({cuantos})
                        </Etiqueta>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {elegidos.length > 0 && (
              <Link
                href="/empresa/candidatos"
                className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
              >
                Quitar filtros
              </Link>
            )}
          </section>

          <p aria-live="polite" className="text-[14px] text-tinta">
            {visibles.length === 1
              ? "1 candidato"
              : `${visibles.length} candidatos`}
            {elegidos.length > 0 && ` de ${candidatos.length}`}
          </p>

          {visibles.length === 0 ? (
            <EstadoVacio
              titulo="Nadie tiene todos esos intereses"
              descripcion="Sacá alguno de los filtros para ver más personas."
              accion={
                <Link
                  href="/empresa/candidatos"
                  className="text-[14px] font-medium text-acento hover:underline"
                >
                  Quitar filtros
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-3">
              {visibles.map((candidato) => {
                const { persona } = candidato;
                const nombre = `${persona.nombre} ${persona.apellido}`;
                return (
                  <li
                    key={persona.id}
                    className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar nombre={nombre} url={persona.foto_url} />
                      <div className="min-w-0">
                        <h2 className="text-[17px] font-semibold text-tinta">
                          {nombre}
                        </h2>
                        <p className="text-[13px] text-apagado">
                          @{persona.nombre_usuario} · {persona.pais}
                        </p>
                      </div>
                    </div>

                    {candidato.tags.length > 0 && (
                      <ul
                        className="flex flex-wrap gap-1.5"
                        aria-label="Intereses"
                      >
                        {candidato.tags.map((tag) => (
                          <li key={tag}>
                            {elegidos.includes(tag) ? (
                              <Etiqueta marcada="coincide con el filtro">
                                {tag}
                              </Etiqueta>
                            ) : (
                              <Etiqueta>{tag}</Etiqueta>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-1.5">
                      <h3 className="text-[13.5px] font-semibold text-tinta">
                        Habilidades declaradas
                      </h3>
                      <HabilidadesDeclaradas
                        habilidades={candidato.habilidades}
                      />
                    </div>

                    <ul className="divide-y divide-filete border-t border-filete">
                      {candidato.postulaciones.map((p) => {
                        const estado = new EstadoParaEmpresa(p.estado);
                        return (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 pt-2.5"
                          >
                            <Link
                              href={`/empresa/busquedas/${p.busqueda.id}/postulantes/${p.id}`}
                              className="text-[14px] font-medium text-acento underline-offset-4 hover:underline"
                            >
                              Se postuló a «{p.busqueda.titulo}»
                            </Link>
                            <Insignia tono={estado.tono}>
                              {estado.etiqueta}
                            </Insignia>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
