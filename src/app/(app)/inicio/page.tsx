import Link from "next/link";

import { TarjetaVacante } from "@/components/empleos/TarjetaVacante";
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
  obtenerVacantes,
  obtenerVacantesPostuladas,
} from "@/lib/data/consultas";

export const dynamic = "force-dynamic";

type Vista = "empleos" | "eventos";

/**
 * Las dos pestañas son enlaces, no estado del cliente: cada vista tiene su
 * URL, se puede compartir y el navegador la recuerda al volver atrás.
 *
 * Por eso tampoco llevan `role="tab"`: el patrón ARIA de pestañas promete un
 * `tabpanel` asociado y navegación con las flechas, y acá no hay ni una cosa
 * ni la otra. Son enlaces de navegación y se anuncian como tales; el activo
 * se marca con `aria-current="page"`, igual que en la barra lateral.
 */
function Pestanas({ activa }: { activa: Vista }) {
  const pestanas: { vista: Vista; etiqueta: string }[] = [
    { vista: "empleos", etiqueta: "Oportunidades laborales" },
    { vista: "eventos", etiqueta: "Eventos de networking" },
  ];

  return (
    <div className="flex gap-1 border-b border-borde">
      {pestanas.map(({ vista, etiqueta }) => {
        const seleccionada = vista === activa;

        return (
          <Link
            key={vista}
            aria-current={seleccionada ? "page" : undefined}
            href={vista === "empleos" ? "/inicio" : "/inicio?vista=eventos"}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-[color,border-color] ${
              seleccionada
                ? "border-primario font-semibold text-primario"
                : "border-transparent font-medium text-tinta-suave hover:text-tinta"
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

  const [vacantes, eventos, perfil, postulaciones, yaPostuladas, yaInscriptos] =
    await Promise.all([
      obtenerVacantes({ limite: 6 }),
      obtenerEventos(4),
      obtenerPerfilActual(),
      obtenerPostulaciones(),
      obtenerVacantesPostuladas(),
      obtenerEventosInscriptos(),
    ]);

  const resultado = activa === "empleos" ? vacantes : eventos;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <Encabezado
          titulo={`Hola, ${perfil.datos.nombre}`}
          descripcion="Estas son las oportunidades y los eventos que mejor coinciden con las habilidades de tu perfil."
        />

        <AvisoOrigen resultado={resultado} />

        <Pestanas activa={activa} />

        {activa === "empleos" ? (
          <section className="space-y-4" aria-label="Oportunidades laborales">
            {vacantes.datos.length === 0 ? (
              <EstadoVacio
                titulo="Todavía no hay vacantes publicadas"
                descripcion="Cuando una empresa publique una búsqueda que coincida con tus habilidades, va a aparecer acá."
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

      <aside className="xl:sticky xl:top-8 xl:self-start">
        <TarjetaUsuario
          perfil={perfil.datos}
          postulaciones={postulaciones.datos.length}
        />
      </aside>
    </div>
  );
}
