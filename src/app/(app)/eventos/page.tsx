import type { Metadata } from "next";

import { TarjetaEvento } from "@/components/eventos/TarjetaEvento";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { obtenerEventos, obtenerEventosInscriptos } from "@/lib/data/consultas";

export const metadata: Metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function PaginaEventos() {
  const [eventos, yaInscriptos] = await Promise.all([
    obtenerEventos(20),
    obtenerEventosInscriptos(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Eventos de networking"
        descripcion="Charlas, talleres y ferias que organizan empresas e instituciones educativas. La inscripción es gratuita."
      />

      <AvisoOrigen resultado={eventos} />

      <section className="space-y-4">
        {eventos.datos.length === 0 ? (
          <EstadoVacio
            titulo="No hay eventos en agenda"
            descripcion="Cuando una organización publique una actividad, vas a verla acá con su fecha y su organizador."
          />
        ) : (
          eventos.datos.map((evento) => (
            <TarjetaEvento
              key={evento.id}
              evento={evento}
              yaInscripto={yaInscriptos.has(evento.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}
