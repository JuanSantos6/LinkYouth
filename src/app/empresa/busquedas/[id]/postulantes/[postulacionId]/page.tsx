import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CambioDeEstado } from "@/components/empresa/CambioDeEstado";
import { Coincidencia } from "@/components/empresa/Coincidencia";
import { HabilidadesDeclaradas } from "@/components/empresa/HabilidadesDeclaradas";
import { Avatar } from "@/components/ui/Avatar";
import { Aviso, AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import {
  obtenerBusqueda,
  obtenerPostulacionesRecibidas,
} from "@/lib/data/empresa";
import { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";
import { etiquetaEstadoFormacion, tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Postulante" };
export const dynamic = "force-dynamic";

function Seccion({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-[19px] font-bold text-tinta">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/**
 * La ficha de una persona que se postuló a una búsqueda propia (RF3.4.1,
 * RF3.4.2) y el lugar donde la empresa mueve su postulación (RF3.4.3).
 *
 * Todo lo que se ve sale de lo que la persona cargó: nombre, bio, formación,
 * habilidades declaradas e intereses. Nada de eso lo verificó la plataforma,
 * y la pantalla lo dice.
 */
export default async function PaginaPostulante({
  params,
}: {
  params: Promise<{ id: string; postulacionId: string }>;
}) {
  const { id, postulacionId } = await params;

  const resultado = await obtenerBusqueda(id);
  if (!resultado) notFound();
  const busqueda = resultado.datos;

  const postulaciones = await obtenerPostulacionesRecibidas(busqueda.id);
  const postulacion = postulaciones.datos.find((p) => p.id === postulacionId);
  if (!postulacion) notFound();

  const esEjemplo = postulaciones.origen === "ejemplo";
  const estado = new EstadoParaEmpresa(postulacion.estado);
  const coincidencia = CoincidenciaDeCandidato.entre(
    {
      habilidades: busqueda.habilidades.map((h) => h.nombre),
      tagsOcultos: busqueda.tagsOcultos.map((t) => t.nombre),
    },
    postulacion,
  );
  const { persona } = postulacion;
  const volver = `/empresa/busquedas/${busqueda.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href={volver}
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← {busqueda.titulo}
      </Link>

      <AvisoOrigen resultado={postulaciones} />

      {!persona ? (
        <EstadoVacio
          titulo="Esta persona se retiró del proceso"
          descripcion="Cuando alguien retira su postulación deja de compartir sus datos con la empresa. La postulación queda en el historial de la búsqueda."
          accion={
            <Link
              href={volver}
              className="text-[14px] font-medium text-acento hover:underline"
            >
              Volver a los postulantes
            </Link>
          }
        />
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar
              nombre={`${persona.nombre} ${persona.apellido}`}
              url={persona.foto_url}
              tamano="lg"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[32px]">
                  {persona.nombre} {persona.apellido}
                </h1>
                <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
              </div>
              <p className="flex flex-wrap gap-x-3 text-[14px] text-apagado">
                <span>@{persona.nombre_usuario}</span>
                <span>{persona.pais}</span>
                <span>se postuló {tiempoRelativo(postulacion.creada_en)}</span>
              </p>
            </div>
          </header>

          <section
            aria-labelledby="t-proceso"
            className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-5"
          >
            <h2 id="t-proceso" className="text-[17px] font-bold text-tinta">
              Estado del proceso
            </h2>
            {estado.final ? (
              <p className="text-[14.5px] text-tinta">
                La postulación está en «{estado.etiqueta}», que es un estado
                final.
              </p>
            ) : (
              <>
                <p className="text-[14.5px] text-tinta">
                  Está en «{estado.etiqueta}». Cada cambio le llega a la persona
                  como aviso, en sus postulaciones.
                </p>
                <CambioDeEstado
                  postulacionId={postulacion.id}
                  estado={postulacion.estado}
                  nombre={persona.nombre}
                  esEjemplo={esEjemplo}
                />
              </>
            )}
          </section>

          {persona.bio && (
            <Seccion id="t-bio" titulo={`Sobre ${persona.nombre}`}>
              <p className="text-[15.5px] leading-relaxed whitespace-pre-line text-tinta">
                {persona.bio}
              </p>
            </Seccion>
          )}

          <Seccion id="t-habilidades" titulo="Habilidades declaradas">
            <Coincidencia coincidencia={coincidencia} />
            <HabilidadesDeclaradas
              habilidades={postulacion.habilidades}
              coincidencia={coincidencia}
            />
            {coincidencia.habilidadesQueNoDeclara.length > 0 && (
              <p className="text-[14px] text-apagado">
                Pedís y no declara:{" "}
                {coincidencia.habilidadesQueNoDeclara.join(", ")}.
              </p>
            )}
            <Aviso>
              Las habilidades las declara cada persona en su perfil. LinkYouth
              todavía no las verifica: la entrevista es el lugar para
              confirmarlas.
            </Aviso>
          </Seccion>

          <Seccion id="t-intereses" titulo="Intereses">
            {postulacion.tags.length === 0 ? (
              <p className="text-[14px] text-apagado">No cargó intereses.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {postulacion.tags.map((tag) => (
                  <li key={tag}>
                    {coincidencia.esInteresClave(tag) ? (
                      <Etiqueta marcada="interés clave de la búsqueda">
                        {tag}
                      </Etiqueta>
                    ) : (
                      <Etiqueta>{tag}</Etiqueta>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion id="t-formacion" titulo="Formación">
            {postulacion.formaciones.length === 0 ? (
              <p className="text-[14px] text-apagado">No cargó estudios.</p>
            ) : (
              <ul className="divide-y divide-filete border-y border-filete">
                {postulacion.formaciones.map((formacion) => (
                  <li
                    key={formacion.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                  >
                    <span>
                      <span className="block text-[15px] font-medium text-tinta">
                        {formacion.titulo}
                      </span>
                      <span className="block text-[13.5px] text-apagado">
                        {formacion.institucion}
                      </span>
                    </span>
                    <Insignia>
                      {etiquetaEstadoFormacion(formacion.estado)}
                    </Insignia>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
        </>
      )}
    </div>
  );
}
