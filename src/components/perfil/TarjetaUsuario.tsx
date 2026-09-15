import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { BotonEnlace } from "@/components/ui/Boton";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { Formacion, PerfilCompleto } from "@/lib/data/tipos";
import { Institucion } from "@/lib/dominio/Institucion";

/**
 * Tu ficha, en la columna derecha del feed.
 *
 * Es un solo bloque: identidad, estudio, números y habilidades comparten
 * superficie y se separan con filetes, no con aire. La versión anterior
 * dejaba respiros tan grandes entre las partes que en el teléfono parecían
 * cuatro tarjetas apiladas, y la lectura se volvía «cuántas cosas hay acá»
 * en vez de «quién sos».
 *
 * Repite lo justo del perfil. Los números van en la tipografía de título
 * porque son el dato que se mira de reojo; están para dar contexto de tu
 * propia actividad, no para competir con nadie.
 */
export function TarjetaUsuario({
  perfil,
  postulaciones,
}: {
  perfil: PerfilCompleto;
  postulaciones: number;
}) {
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;

  // La formación en curso es la que define dónde estás hoy. Sin ninguna en
  // curso vale la última terminada: es lo que igual te describe.
  const formacion =
    perfil.formaciones.find((una) => una.estado === "en_curso") ??
    perfil.formaciones[0];

  const metricas = [
    { valor: perfil.habilidades.length, rotulo: "habilidades" },
    { valor: postulaciones, rotulo: "postulaciones" },
    { valor: perfil.formaciones.length, rotulo: "estudios" },
  ];

  return (
    <Tarjeta className="divide-y divide-filete">
      <div className="flex items-center gap-3 p-5">
        <Avatar nombre={nombreCompleto} url={perfil.foto_url} />

        <div className="min-w-0">
          <h2 className="truncate text-[17px] text-tinta">{nombreCompleto}</h2>
          <p className="truncate text-[13px] text-apagado">
            @{perfil.nombre_usuario}
            <span className="ml-2">{perfil.pais}</span>
          </p>
        </div>
      </div>

      {formacion && <BloqueInstitucion formacion={formacion} />}

      <dl className="px-5">
        {metricas.map(({ valor, rotulo }) => (
          <div
            key={rotulo}
            className="flex items-baseline justify-between border-b border-filete py-2.5 last:border-b-0"
          >
            <dt className="text-[13px] text-apagado">{rotulo}</dt>
            <dd className="cifra text-[20px] text-tinta">{valor}</dd>
          </div>
        ))}
      </dl>

      {perfil.habilidades.length > 0 && (
        <div className="p-5">
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

      <div className="p-5">
        <BotonEnlace href="/perfil" className="w-full">
          Ver mi perfil
        </BotonEnlace>
      </div>
    </Tarjeta>
  );
}

/**
 * Dónde estudiás, como enlace a la ficha de la institución.
 *
 * Toda la fila es el enlace, no una flecha ni un «ver más» al final: el área
 * de toque en un teléfono tiene que ser la fila entera.
 *
 * El recuadro son iniciales y no un logo porque no hay logo que traer: la
 * institución es texto libre en `formaciones` y no tiene fila propia. Cuando
 * exista la tabla, el logo entra acá sin tocar el resto.
 */
function BloqueInstitucion({ formacion }: { formacion: Formacion }) {
  const institucion = new Institucion(formacion.institucion);

  return (
    <Link
      href={`/institucion/${institucion.id}`}
      className="flex items-center gap-3 p-5 transition-colors duration-150 hover:bg-realce"
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-borde bg-realce text-[13px] font-semibold text-apagado"
      >
        {institucion.iniciales}
      </span>

      {/*
       * El estado va en su propia línea y no pegado al nombre: dentro del
       * `truncate` de la institución quedaba cortado en «e…», que no dice
       * nada y encima parece un error de datos.
       */}
      <span className="min-w-0">
        <span className="block truncate text-[14px] text-tinta">
          {formacion.titulo}
        </span>
        <span className="block truncate text-[13px] text-apagado">
          {formacion.institucion}
        </span>
        {formacion.estado === "en_curso" && (
          <span className="block text-[13px] text-apagado">en curso</span>
        )}
      </span>
    </Link>
  );
}
