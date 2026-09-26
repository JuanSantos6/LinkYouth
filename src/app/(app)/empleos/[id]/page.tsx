import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccionConCuenta } from "@/components/auth/InvitacionACuenta";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonAccion } from "@/components/ui/BotonAccion";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { postularse } from "@/lib/acciones/postulaciones";
import {
  obtenerPerfilActual,
  obtenerUsuarioId,
  obtenerVacante,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";
import { Compatibilidad } from "@/lib/dominio/Compatibilidad";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vacante = await obtenerVacante(id);

  return { title: vacante?.datos.titulo ?? "Vacante" };
}

/**
 * RF3.5.3 — El detalle de una vacante: el «ver más» del feed.
 *
 * Se lee con o sin sesión, como el listado. Es también la pantalla a la que se
 * vuelve después de crear la cuenta desde «Postularme»: por eso el botón está
 * acá además de en la fila, para terminar lo que se empezó sin tener que
 * volver a buscar la vacante.
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

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/empleos"
        className="inline-block text-[14px] text-apagado transition-colors duration-150 hover:text-tinta"
      >
        <span aria-hidden="true">← </span>
        Todas las búsquedas
      </Link>

      <AvisoOrigen resultado={resultado} />

      <header className="flex flex-wrap items-start gap-4">
        <Avatar
          nombre={vacante.empresa.razon_social}
          url={vacante.empresa.logo_url}
          forma="cuadrado"
        />

        <div className="min-w-0 flex-1 basis-60">
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-apagado">
            <span className="font-medium text-tinta">
              {vacante.empresa.razon_social}
            </span>
            <span>{vacante.empresa.rubro}</span>
            <span>{tiempoRelativo(vacante.creada_en)}</span>
          </p>

          <h1 className="mt-1 text-[26px] leading-tight text-tinta sm:text-[30px]">
            {vacante.titulo}
          </h1>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-apagado">
            <Insignia tono={vacante.tipo === "pasantia" ? "acento" : "neutro"}>
              {etiquetaTipo(vacante.tipo)}
            </Insignia>
            <span>
              {vacante.posiciones === 1
                ? "1 posición"
                : `${vacante.posiciones} posiciones`}
            </span>
          </p>
        </div>

        {conSesion && compatibilidad.medible && (
          <p className="flex flex-col items-end">
            <span className="cifra text-[34px] text-tinta">
              {compatibilidad.porcentaje}
              <span className="text-[18px] text-apagado">%</span>
            </span>
            <span className="text-[12px] text-apagado">compatible</span>
          </p>
        )}
      </header>

      <section>
        <h2 className="text-[16px] font-medium text-tinta">La búsqueda</h2>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-apagado">
          {vacante.descripcion}
        </p>
      </section>

      {requisitos.length > 0 && (
        <section>
          <h2 className="text-[16px] font-medium text-tinta">Qué pide</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
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
            <p className="mt-3 text-[14px] text-apagado">
              Creá tu cuenta para ver cuánto coincidís con esta búsqueda.
            </p>
          )}
        </section>
      )}

      <div className="flex justify-end border-t border-filete pt-5">
        {conSesion || esEjemplo ? (
          <BotonAccion
            accion={postularse}
            campo="vacanteId"
            valor={vacante.id}
            hecho={yaPostuladas.has(vacante.id)}
            esEjemplo={esEjemplo}
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
    </article>
  );
}
