import { BotonEnlace } from "@/components/ui/Boton";
import { Avatar } from "@/components/ui/Avatar";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { PerfilCompleto } from "@/lib/data/tipos";

/**
 * Tu ficha, en la columna derecha del feed.
 *
 * Repite lo justo del perfil: quién sos, qué estudiás y qué sabés hacer. Los
 * números van en la tipografía de título porque son el dato que se mira de
 * reojo; están para dar contexto de tu propia actividad, no para competir con
 * nadie.
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

  const metricas = [
    { valor: perfil.habilidades.length, rotulo: "habilidades" },
    { valor: postulaciones, rotulo: "postulaciones" },
    { valor: perfil.formaciones.length, rotulo: "estudios" },
  ];

  return (
    <Tarjeta className="p-5">
      <div className="flex items-center gap-3">
        <Avatar nombre={nombreCompleto} url={perfil.foto_url} />

        <div className="min-w-0">
          <h2 className="truncate text-[17px] text-tinta">{nombreCompleto}</h2>
          <p className="truncate text-[13px] text-apagado">
            @{perfil.nombre_usuario}
          </p>
        </div>
      </div>

      {enCurso && (
        <p className="mt-4 text-[14px] leading-relaxed text-tinta">
          {enCurso.titulo}
          <span className="mt-0.5 block text-[13px] text-apagado">
            {enCurso.institucion}
          </span>
        </p>
      )}

      <p className="mt-3 text-[13px] text-apagado">{perfil.pais}</p>

      <dl className="mt-5 divide-y divide-filete border-y border-filete">
        {metricas.map(({ valor, rotulo }) => (
          <div
            key={rotulo}
            className="flex items-baseline justify-between py-2"
          >
            <dt className="text-[13px] text-apagado">{rotulo}</dt>
            <dd className="cifra text-[20px] text-tinta">{valor}</dd>
          </div>
        ))}
      </dl>

      {perfil.habilidades.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[14px] font-medium text-tinta">
            Lo que sabés hacer
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

      <BotonEnlace href="/perfil" className="mt-5 w-full">
        Ver mi perfil
      </BotonEnlace>
    </Tarjeta>
  );
}
