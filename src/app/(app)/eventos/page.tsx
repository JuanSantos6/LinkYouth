import type { Metadata } from "next";

import { TarjetaEvento } from "@/components/eventos/TarjetaEvento";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { obtenerEventos } from "@/lib/data/consultas";

export const metadata: Metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function PaginaEventos() {
  const eventos = await obtenerEventos(20);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Encabezado
        titulo="Eventos de networking"
        descripcion="Charlas, talleres y ferias que organizan empresas e instituciones educativas. La inscripción es gratuita."
      />

      <AvisoOrigen resultado={eventos} />

      <section className="space-y-4">
        {eventos.datos.length === 0 ? (
          <EstadoVacio
            titulo="No hay eventos en agenda"
            descripcion="Cuando una organización publique una actividad, vas a verla acá con su fecha y sus cupos."
          />
        ) : (
          eventos.datos.map((evento) => (
            <TarjetaEvento key={evento.id} evento={evento} />
          ))
        )}
      </section>
    </div>
  );
}
