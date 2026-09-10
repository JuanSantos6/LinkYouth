import { BotonEnlace } from "@/components/ui/Boton";
import { IconoUbicacion } from "@/components/layout/Iconos";
import { Avatar } from "@/components/ui/Avatar";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { PerfilCompleto } from "@/lib/data/tipos";

/**
 * Ficha del postulante para la columna derecha.
 *
 * Repite lo justo del perfil: quién sos, qué estudiás y qué sabés hacer. Las
 * métricas están para dar contexto de la actividad propia, no para competir
 * con nadie.
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
            <Avatar nombre={nombreCompleto} url={perfil.foto_url} tamano="md" />
          </div>
        </div>

        <h2 className="text-base font-bold text-tinta">{nombreCompleto}</h2>

        <p className="mt-0.5 text-xs text-tinta-suave">
          @{perfil.nombre_usuario}
        </p>

        {enCurso && (
          <p className="mt-2 text-sm leading-relaxed text-tinta-media">
            {enCurso.titulo} · {enCurso.institucion}
          </p>
        )}

        <p className="mt-2 flex items-center gap-1.5 text-xs text-tinta-suave">
          <IconoUbicacion className="h-3.5 w-3.5 text-tinta-tenue" />
          {perfil.pais}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-borde py-3 text-center">
          <div>
            <dd className="text-sm font-bold text-tinta">
              {perfil.habilidades.length}
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

        {perfil.habilidades.length > 0 && (
          <div className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
              Principales habilidades
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {perfil.habilidades.slice(0, 5).map((habilidad) => (
                <li key={habilidad}>
                  <Etiqueta>{habilidad}</Etiqueta>
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
