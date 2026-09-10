import { BotonEnlace } from "@/components/ui/Boton";
import { IconoUbicacion, IconoVerificado } from "@/components/layout/Iconos";
import { Avatar } from "@/components/ui/Avatar";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
// TODO: reconectar contra db/schema.sql
import type { PerfilCompleto } from "@/lib/data/tipos";

/**
 * Ficha del postulante para la columna derecha.
 *
 * Repite lo justo del perfil: quién sos, dónde estudiás y qué sabés hacer.
 * Las métricas están para dar contexto de la actividad propia, no para
 * competir con nadie.
 */
export function TarjetaUsuario({
  perfil,
  postulaciones,
}: {
  perfil: PerfilCompleto;
  postulaciones: number;
}) {
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const enCurso = perfil.formaciones.find(
    (formacion) => formacion.estado === "en_curso",
  );

  return (
    <Tarjeta className="overflow-hidden">
      <div
        className="h-16 bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6]"
        aria-hidden="true"
      />

      <div className="px-5 pb-5">
        <div className="-mt-9 mb-3">
          <div className="inline-block rounded-full border-4 border-superficie">
            <Avatar
              nombre={nombreCompleto}
              url={perfil.avatar_url}
              tamano="md"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-tinta">{nombreCompleto}</h2>
          {perfil.verificado && (
            <>
              <IconoVerificado className="h-4 w-4 text-primario" />
              <span className="sr-only">Perfil verificado</span>
            </>
          )}
        </div>

        <p className="mt-0.5 text-xs text-tinta-suave">
          @{perfil.nombre_usuario}
        </p>

        {perfil.titular && (
          <p className="mt-2 text-sm leading-relaxed text-tinta-media">
            {perfil.titular}
          </p>
        )}

        {enCurso && (
          <p className="mt-2 text-xs text-tinta-suave">
            {enCurso.titulo} · {enCurso.institucion}
          </p>
        )}

        {(perfil.ciudad || perfil.pais) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-tinta-suave">
            <IconoUbicacion className="h-3.5 w-3.5 text-tinta-tenue" />
            {[perfil.ciudad, perfil.pais].filter(Boolean).join(", ")}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-borde py-3 text-center">
          <div>
            <dd className="text-sm font-bold text-tinta">
              {perfil.tags.length}
            </dd>
            <dt className="text-[11px] text-tinta-suave">Habilidades</dt>
          </div>
          <div>
            <dd className="text-sm font-bold text-tinta">{postulaciones}</dd>
            <dt className="text-[11px] text-tinta-suave">Postulaciones</dt>
          </div>
          <div>
            <dd className="text-sm font-bold text-tinta">
              {perfil.formaciones.length}
            </dd>
            <dt className="text-[11px] text-tinta-suave">Estudios</dt>
          </div>
        </dl>

        {perfil.tags.length > 0 && (
          <div className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
              Principales habilidades
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {perfil.tags.slice(0, 5).map((tag) => (
                <li key={tag.slug}>
                  <Etiqueta>{tag.nombre}</Etiqueta>
                </li>
              ))}
            </ul>
          </div>
        )}

        <BotonEnlace href="/perfil" className="mt-4 w-full">
          Ver mi perfil
        </BotonEnlace>
      </div>
    </Tarjeta>
  );
}
