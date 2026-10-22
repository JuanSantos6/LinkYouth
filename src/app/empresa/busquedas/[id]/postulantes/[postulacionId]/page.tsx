import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CambioDeEstado } from "@/components/empresa/CambioDeEstado";
import { Coincidencia } from "@/components/empresa/Coincidencia";
import { HabilidadesDeclaradas } from "@/components/empresa/HabilidadesDeclaradas";
import { ImagenDeInstitucion } from "@/components/perfil/ImagenDeInstitucion";
import { InsigniaDePersonalidad } from "@/components/perfil/InsigniaDePersonalidad";
import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import {
  obtenerBusqueda,
  obtenerPersonalidadCompartida,
  obtenerPostulacionesRecibidas,
} from "@/lib/data/empresa";
import { fotosDeInstituciones } from "@/lib/data/fotos";
import { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";
import { TipoDePersonalidad } from "@/lib/dominio/TipoDePersonalidad";
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
    <section
      aria-labelledby={id}
      className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-5"
    >
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
 * Arriba, foto, nombre, datos clave y las acciones del proceso. Después, en
 * secciones separadas: compatibilidad (solo la ve la empresa, RF3.9.2),
 * habilidades, intereses, formación con la imagen de cada institución y la
 * biografía. Todo sale de lo que la persona cargó; nada lo verificó la
 * plataforma, y la pantalla lo dice.
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
    CoincidenciaDeCandidato.requisitosDe(busqueda),
    postulacion,
  );
  const { persona } = postulacion;
  const [fotosInstitucion, personalidad] = await Promise.all([
    fotosDeInstituciones(postulacion.formaciones.map((f) => f.institucion)),
    // Solo llega si la persona lo compartió (RLS, migración 009). Se muestra
    // y nada más: no entra en `coincidencia` ni en ningún orden.
    persona ? obtenerPersonalidadCompartida(persona.id) : null,
  ]);
  const tipoDePersonalidad = TipoDePersonalidad.de(personalidad);
  const volver = `/empresa/busquedas/${busqueda.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={volver}
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← {busqueda.titulo}
      </Link>

      <AvisoOrigen resultado={postulaciones} />

      {!persona ? (
        <EstadoVacio
          nivel={1}
          ilustracion="personas"
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
          <header className="space-y-5 rounded-tarjeta border border-borde bg-superficie p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar
                nombre={`${persona.nombre} ${persona.apellido}`}
                url={persona.foto_url}
                semilla={persona.id}
                tamano="lg"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <h1 className="text-[26px] leading-tight font-extrabold text-tinta sm:text-[30px]">
                  {persona.nombre} {persona.apellido}
                </h1>
                <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[14px] text-apagado">
                  <span>@{persona.nombre_usuario}</span>
                  <span>{persona.pais}</span>
                  <span>
                    se postuló {tiempoRelativo(postulacion.creada_en)}
                  </span>
                </p>
                <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
              </div>
            </div>

            <div className="space-y-3 border-t border-filete pt-4">
              <p className="text-[14.5px] text-tinta">
                {estado.final
                  ? `Está en «${estado.etiqueta}», que es un estado final.`
                  : `Está en «${estado.etiqueta}». Cada cambio le llega como aviso.`}
              </p>
              {!estado.final && (
                <CambioDeEstado
                  postulacionId={postulacion.id}
                  estado={postulacion.estado}
                  nombre={persona.nombre}
                  esEjemplo={esEjemplo}
                />
              )}
            </div>
          </header>

          <Seccion id="t-compatibilidad" titulo="Compatibilidad">
            <Coincidencia coincidencia={coincidencia} />
            {coincidencia.habilidadesQueNoDeclara.length > 0 && (
              <p className="text-[14px] text-apagado">
                Pedís y no declara:{" "}
                {coincidencia.habilidadesQueNoDeclara.join(", ")}.
              </p>
            )}
            <p className="text-[13px] text-apagado">
              Solo la ves vos: la persona no ve esta comparación.
            </p>
          </Seccion>

          <Seccion id="t-habilidades" titulo="Habilidades">
            <HabilidadesDeclaradas
              habilidades={postulacion.habilidades}
              coincidencia={coincidencia}
            />
            <p className="text-[13px] text-apagado">
              Las declara la persona y LinkYouth todavía no las verifica: la
              entrevista es el lugar para confirmarlas.
            </p>
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
              <ul className="space-y-2.5">
                {postulacion.formaciones.map((formacion) => (
                  <li
                    key={formacion.id}
                    className="flex items-center gap-3 rounded-ficha border border-filete p-3"
                  >
                    <ImagenDeInstitucion
                      nombre={formacion.institucion}
                      url={fotosInstitucion[formacion.institucion]}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-tinta">
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

          {tipoDePersonalidad && (
            <Seccion id="t-personalidad" titulo="Personalidad">
              <InsigniaDePersonalidad
                tipo={tipoDePersonalidad}
                tamano="compacta"
                etiqueta="Declarado por el postulante"
              />
              <p className="text-[13px] text-apagado">
                Lo cargó la persona a partir del test de 16Personalities.
                LinkYouth no lo valida y no lo usa en la compatibilidad.
              </p>
            </Seccion>
          )}

          <Seccion id="t-bio" titulo={`Sobre ${persona.nombre}`}>
            {persona.bio ? (
              <p className="max-w-[65ch] text-[15.5px] leading-relaxed whitespace-pre-line text-tinta">
                {persona.bio}
              </p>
            ) : (
              <p className="text-[14px] text-apagado">
                Todavía no escribió una biografía.
              </p>
            )}
          </Seccion>
        </>
      )}
    </div>
  );
}
