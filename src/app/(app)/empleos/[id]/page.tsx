import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccionConCuenta } from "@/components/auth/InvitacionACuenta";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonAccion } from "@/components/ui/BotonAccion";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { Medidor } from "@/components/ui/Medidor";
import { postularse } from "@/lib/acciones/postulaciones";
import {
  obtenerPerfilActual,
  obtenerUsuarioId,
  obtenerVacante,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";
import { Compatibilidad } from "@/lib/dominio/Compatibilidad";
import { ETAPAS } from "@/lib/dominio/ProcesoDePostulacion";
import { ETIQUETA_MODALIDAD } from "@/lib/dominio/ReglasDeBusqueda";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vacante = await obtenerVacante(id);

  return { title: vacante?.datos.titulo ?? "Vacante" };
}

/** Qué pasa en cada etapa del proceso, contado para quien se postula por primera vez. */
const QUE_PASA: Record<(typeof ETAPAS)[number], string> = {
  Enviada: "La empresa recibe tu ficha.",
  "En revisión": "Te avisamos cuando la miren.",
  Resolución: "Aceptada o no seleccionada: siempre te enterás.",
};

/**
 * RF3.5.3 — El detalle de una vacante: el «ver más» del feed.
 *
 * Dos columnas en escritorio: a la izquierda qué vas a hacer y qué pide; a la
 * derecha, fija, la acción con el medidor y «Qué pasa después». En el
 * teléfono todo va en una columna y la acción queda después de «Qué pide»,
 * que es lo que se lee antes de decidir.
 *
 * Se lee con o sin sesión. Es también la pantalla a la que se vuelve después
 * de crear la cuenta desde «Postularme».
 */
export default async function PaginaVacante({ params }: Props) {
  const { id } = await params;

  const usuarioId = (await obtenerUsuarioId()) ?? undefined;
  const conSesion = usuarioId !== undefined;

  const [resultado, perfil, yaPostuladas] = await Promise.all([
    obtenerVacante(id),
    conSesion ? obtenerPerfilActual(usuarioId) : null,
    obtenerVacantesPostuladas(usuarioId),
  ]);

  if (!resultado) notFound();

  const vacante = resultado.datos;
  const esEjemplo = resultado.origen === "ejemplo";
  const compatibilidad = Compatibilidad.entre(vacante, perfil?.datos);
  const requisitos = [...vacante.habilidades, ...vacante.tags];
  const faltantes = compatibilidad.faltantes;

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <EnlaceTransicion
        href="/empleos"
        className="inline-flex rounded-control px-1 py-1 text-[14px] font-medium text-apagado transition-colors duration-150 hover:text-tinta"
      >
        <span aria-hidden="true">←&nbsp;</span>Todas las búsquedas
      </EnlaceTransicion>

      <AvisoOrigen resultado={resultado} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)] lg:items-start">
        <div className="space-y-8">
          <header className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar
                nombre={vacante.empresa.razon_social}
                url={vacante.empresa.logo_url}
                forma="cuadrado"
              />
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px] text-apagado">
                <span className="font-semibold text-tinta">
                  {vacante.empresa.razon_social}
                </span>
                <span>{vacante.empresa.rubro}</span>
                <span>{tiempoRelativo(vacante.creada_en)}</span>
              </p>
            </div>

            <h1 className="text-[30px] leading-tight font-extrabold text-tinta sm:text-[36px]">
              {vacante.titulo}
            </h1>

            <p className="flex flex-wrap items-center gap-2 text-[14px] text-apagado">
              <Insignia
                tono={vacante.tipo === "pasantia" ? "acento" : "neutro"}
              >
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
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-[20px] text-tinta">Qué vas a hacer</h2>
            <p className="max-w-[65ch] whitespace-pre-line text-[16px] leading-relaxed text-apagado">
              {vacante.descripcion}
            </p>
          </section>

          {requisitos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[20px] text-tinta">Qué pide</h2>
              <ul className="flex flex-wrap gap-1.5">
                {requisitos.map((requisito) => (
                  <li key={requisito}>
                    <Etiqueta
                      coincide={conSesion && compatibilidad.cubre(requisito)}
                    >
                      {requisito}
                    </Etiqueta>
                  </li>
                ))}
              </ul>
              {!conSesion && (
                <p className="text-[14px] text-apagado">
                  Creá tu cuenta para ver cuánto coincidís con esta búsqueda.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-5 rounded-tarjeta border border-borde bg-superficie p-5 sm:p-6 lg:sticky lg:top-24">
          {conSesion && compatibilidad.medible && (
            <div className="space-y-2">
              <Medidor
                cubiertos={compatibilidad.cantidadCubierta}
                total={compatibilidad.cantidadRequerida}
                detalle="de lo que pide."
              />
              {faltantes.length > 0 && (
                <p className="text-[13.5px] text-apagado">
                  Te falta: {faltantes.join(", ")}.
                </p>
              )}
            </div>
          )}

          <div className="[&_form]:w-full [&_form_button]:w-full [&>div]:items-stretch">
            {conSesion || esEjemplo ? (
              <BotonAccion
                accion={postularse}
                campo="vacanteId"
                valor={vacante.id}
                hecho={yaPostuladas.has(vacante.id)}
                esEjemplo={esEjemplo}
                celebrar
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
                siguiente={`/empleos/${vacante.id}`}
              />
            )}
          </div>

          <div className="space-y-3 border-t border-filete pt-4">
            <h2 className="text-[15px] font-bold text-tinta">
              Qué pasa después
            </h2>
            <ol className="space-y-3">
              {ETAPAS.map((etapa, indice) => (
                <li key={etapa} className="relative flex gap-3 text-[14px]">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-borde-control bg-superficie font-titulo text-[11px] font-bold text-tinta"
                  >
                    {indice + 1}
                  </span>
                  <span>
                    <b className="block font-semibold text-tinta">{etapa}</b>
                    <span className="text-apagado">{QUE_PASA[etapa]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </article>
  );
}
