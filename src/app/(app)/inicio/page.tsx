import Link from "next/link";

import { ListadoDeVacantes } from "@/components/empleos/ListadoDeVacantes";
import { TarjetaEvento } from "@/components/eventos/TarjetaEvento";
import { Encabezado } from "@/components/layout/Encabezado";
import { TarjetaUsuario } from "@/components/perfil/TarjetaUsuario";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  obtenerEventos,
  obtenerEventosInscriptos,
  obtenerPerfilActual,
  obtenerPostulaciones,
  obtenerUsuarioId,
  obtenerVacantes,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";
import { FeedDeVacantes } from "@/lib/dominio/FeedDeVacantes";

export const dynamic = "force-dynamic";

type Vista = "empleos" | "eventos";

/**
 * Las dos pestañas son enlaces, no estado del cliente: cada vista tiene su
 * URL, se puede compartir y el navegador la recuerda al volver atrás.
 */
function Pestanas({ activa }: { activa: Vista }) {
  const pestanas: { vista: Vista; etiqueta: string }[] = [
    { vista: "empleos", etiqueta: "Oportunidades" },
    { vista: "eventos", etiqueta: "Eventos" },
  ];

  return (
    <div role="tablist" className="flex gap-6 border-b border-borde">
      {pestanas.map(({ vista, etiqueta }) => {
        const seleccionada = vista === activa;

        return (
          <Link
            key={vista}
            role="tab"
            aria-selected={seleccionada}
            href={vista === "empleos" ? "/inicio" : "/inicio?vista=eventos"}
            className={`-mb-px border-b-2 pb-2.5 text-[15px] transition-colors duration-150 ${
              seleccionada
                ? "border-acento font-medium text-tinta"
                : "border-transparent text-apagado hover:text-tinta"
            }`}
          >
            {etiqueta}
          </Link>
        );
      })}
    </div>
  );
}

export default async function PaginaInicio({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista } = await searchParams;
  const activa: Vista = vista === "eventos" ? "eventos" : "empleos";

  // La sesión se valida una sola vez para toda la pantalla. Si cada lectura
  // llamara a `auth.getUser()` por su cuenta, una sola navegación pagaría seis
  // viajes de red para validar siempre la misma sesión.
  const usuarioId = (await obtenerUsuarioId()) ?? undefined;

  const [vacantes, eventos, perfil, postulaciones, yaPostuladas, yaInscriptos] =
    await Promise.all([
      obtenerVacantes({ limite: 6 }),
      obtenerEventos(4),
      obtenerPerfilActual(usuarioId),
      obtenerPostulaciones(usuarioId),
      obtenerVacantesPostuladas(usuarioId),
      obtenerEventosInscriptos(usuarioId),
    ]);

  const feed = FeedDeVacantes.armar(vacantes.datos, perfil.datos);
  const resultado = activa === "empleos" ? vacantes : eventos;

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_286px]">
      <div className="min-w-0 space-y-6">
        <Encabezado
          titulo={`Hola, ${perfil.datos.nombre}`}
          descripcion="Las oportunidades y los eventos que mejor coinciden con lo que ya acreditaste."
        />

        <AvisoOrigen resultado={resultado} />

        <Pestanas activa={activa} />

        {activa === "empleos" ? (
          <section aria-label="Oportunidades laborales">
            {feed.vacio ? (
              <EstadoVacio
                titulo="Todavía no hay vacantes publicadas"
                descripcion="Cuando una empresa publique una búsqueda que coincida con tus habilidades, la vas a ver acá."
              />
            ) : (
              <ListadoDeVacantes
                feed={feed}
                yaPostuladas={yaPostuladas}
                esEjemplo={vacantes.origen === "ejemplo"}
              />
            )}
          </section>
        ) : (
          <section className="space-y-4" aria-label="Eventos de networking">
            {eventos.datos.length === 0 ? (
              <EstadoVacio
                titulo="No hay eventos en agenda"
                descripcion="Las charlas, talleres y ferias que organicen las empresas se publican en esta sección."
              />
            ) : (
              eventos.datos.map((evento) => (
                <TarjetaEvento
                  key={evento.id}
                  evento={evento}
                  yaInscripto={yaInscriptos.has(evento.id)}
                  esEjemplo={eventos.origen === "ejemplo"}
                />
              ))
            )}
          </section>
        )}
      </div>

      <aside className="xl:sticky xl:top-20 xl:self-start">
        <TarjetaUsuario
          perfil={perfil.datos}
          postulaciones={postulaciones.datos.length}
        />
      </aside>
    </div>
  );
}
