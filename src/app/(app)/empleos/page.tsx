import type { Metadata } from "next";
import Link from "next/link";

import { InvitacionACuenta } from "@/components/auth/InvitacionACuenta";
import { ListadoDeVacantes } from "@/components/empleos/ListadoDeVacantes";
import { BuscadorVacantes } from "@/components/layout/BuscadorVacantes";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  obtenerPerfilActual,
  obtenerUsuarioId,
  obtenerVacantes,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";
import { TIPOS_OPORTUNIDAD, type TipoOportunidad } from "@/lib/data/tipos";
import { FeedDeVacantes } from "@/lib/dominio/FeedDeVacantes";

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

  const usuarioId = (await obtenerUsuarioId()) ?? undefined;
  const conSesion = usuarioId !== undefined;

  // Sin sesión no se pide el perfil: `obtenerPerfilActual()` manda a `/login`
  // a quien no tiene uno, y esta pantalla se lee sin cuenta. Sin perfil el
  // feed queda ordenado por fecha, que es lo que resulta de medir todas las
  // vacantes contra un perfil vacío.
  const [vacantes, perfil, yaPostuladas] = await Promise.all([
    obtenerVacantes({ busqueda: q, tipo: tipoValido, limite: 30 }),
    conSesion ? obtenerPerfilActual(usuarioId) : null,
    obtenerVacantesPostuladas(usuarioId),
  ]);

  const feed = FeedDeVacantes.armar(vacantes.datos, perfil?.datos);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Empleos y pasantías"
        descripcion={
          conSesion
            ? "Búsquedas abiertas para primera experiencia laboral, ordenadas por lo que ya acreditaste."
            : "Búsquedas abiertas para primera experiencia laboral, de la más reciente a la más vieja."
        }
      />

      {!conSesion && (
        <InvitacionACuenta
          titulo="Creá tu cuenta para ver cuánto coincidís con cada búsqueda"
          texto="Elegís tus habilidades e intereses una vez, y cada vacante te muestra qué tenés de lo que pide. Postularte también se hace desde tu cuenta."
          siguiente="/empleos"
        />
      )}

      <AvisoOrigen resultado={vacantes} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-sm sm:flex-1">
          <BuscadorVacantes accion="/empleos" valor={q} />
        </div>

        <div className="flex gap-2">
          {FILTROS.map(({ valor, etiqueta }) => {
            const activo = valor === tipoValido;
            const destino = valor ? `/empleos?tipo=${valor}` : "/empleos";

            return (
              <Link
                key={etiqueta}
                href={destino}
                aria-current={activo ? "page" : undefined}
                className={`rounded-control border px-3 py-1.5 text-[13px] transition-colors duration-150 ${
                  activo
                    ? "border-tinta text-tinta"
                    : "border-borde-control text-apagado hover:text-tinta"
                }`}
              >
                {etiqueta}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-[14px] text-apagado">
        {feed.cantidad === 1
          ? "1 búsqueda abierta"
          : `${feed.cantidad} búsquedas abiertas`}
        {q ? ` para «${q}»` : ""}
      </p>

      <section>
        {feed.vacio ? (
          <EstadoVacio
            titulo="No encontramos vacantes con ese criterio"
            descripcion="Probá con menos palabras, o mirá todas las búsquedas abiertas."
            accion={
              <Link
                href="/empleos"
                className="text-[14px] font-medium text-acento hover:underline"
              >
                Ver todas las vacantes
              </Link>
            }
          />
        ) : (
          <ListadoDeVacantes
            feed={feed}
            yaPostuladas={yaPostuladas}
            esEjemplo={vacantes.origen === "ejemplo"}
            conSesion={conSesion}
          />
        )}
      </section>
    </div>
  );
}
