import type { Metadata } from "next";
import Link from "next/link";

import { TarjetaVacante } from "@/components/empleos/TarjetaVacante";
import { BuscadorVacantes } from "@/components/layout/BuscadorVacantes";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  obtenerPerfilActual,
  obtenerVacantes,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";
import { TIPOS_OPORTUNIDAD, type TipoOportunidad } from "@/lib/data/tipos";

export const metadata: Metadata = { title: "Empleos" };
export const dynamic = "force-dynamic";

const FILTROS: { valor?: TipoOportunidad; etiqueta: string }[] = [
  { etiqueta: "Todas" },
  { valor: "empleo", etiqueta: "Empleos" },
  { valor: "pasantia", etiqueta: "Pasantías" },
];

export default async function PaginaEmpleos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q, tipo } = await searchParams;

  const tipoValido = (TIPOS_OPORTUNIDAD as readonly string[]).includes(
    tipo ?? "",
  )
    ? (tipo as TipoOportunidad)
    : undefined;

  const [vacantes, perfil, yaPostuladas] = await Promise.all([
    obtenerVacantes({ busqueda: q, tipo: tipoValido, limite: 30 }),
    obtenerPerfilActual(),
    obtenerVacantesPostuladas(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Encabezado
        titulo="Empleos y pasantías"
        descripcion="Búsquedas abiertas para primera experiencia laboral. La compatibilidad se calcula contra las habilidades de tu perfil."
      />

      <AvisoOrigen resultado={vacantes} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-md sm:flex-1">
          <BuscadorVacantes accion="/empleos" valor={q} />
        </div>

        <div className="flex gap-1.5">
          {FILTROS.map(({ valor, etiqueta }) => {
            const activo = valor === tipoValido;
            const destino = valor ? `/empleos?tipo=${valor}` : "/empleos";

            return (
              <Link
                key={etiqueta}
                href={destino}
                aria-current={activo ? "page" : undefined}
                className={`rounded-control border px-3 py-1.5 text-xs font-semibold transition-[color,background-color,border-color] ${
                  activo
                    ? "border-primario-borde bg-primario-suave text-primario-fuerte"
                    : "border-borde bg-superficie text-tinta-media hover:border-borde-fuerte"
                }`}
              >
                {etiqueta}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-tinta-suave">
        {vacantes.datos.length === 1
          ? "1 búsqueda abierta"
          : `${vacantes.datos.length} búsquedas abiertas`}
        {q ? ` para «${q}»` : ""}
      </p>

      <section className="space-y-4">
        {vacantes.datos.length === 0 ? (
          <EstadoVacio
            titulo="No encontramos vacantes con ese criterio"
            descripcion="Probá con menos palabras o mirá todas las búsquedas abiertas."
            accion={
              <Link
                href="/empleos"
                className="text-sm font-semibold text-primario hover:underline"
              >
                Ver todas las vacantes
              </Link>
            }
          />
        ) : (
          vacantes.datos.map((vacante) => (
            <TarjetaVacante
              key={vacante.id}
              vacante={vacante}
              tagsPerfil={perfil.datos.tags}
              habilidadesPerfil={perfil.datos.habilidades}
              yaPostulado={yaPostuladas.has(vacante.id)}
              esEjemplo={vacantes.origen === "ejemplo"}
            />
          ))
        )}
      </section>
    </div>
  );
}
