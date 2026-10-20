import type { Metadata } from "next";

import { InvitacionACuenta } from "@/components/auth/InvitacionACuenta";
import { TarjetaEvento } from "@/components/eventos/TarjetaEvento";
import { Encabezado } from "@/components/layout/Encabezado";
import { MapaInteractivo } from "@/components/mapa/MapaInteractivo";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  obtenerEventos,
  obtenerEventosInscriptos,
  obtenerUsuarioId,
} from "@/lib/data/consultas";
import type { Evento } from "@/lib/data/tipos";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";
import { fechaLarga, hora } from "@/lib/formato";

export const metadata: Metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function PaginaEventos() {
  const usuarioId = (await obtenerUsuarioId()) ?? undefined;
  const conSesion = usuarioId !== undefined;

  const [eventos, yaInscriptos] = await Promise.all([
    obtenerEventos(20),
    obtenerEventosInscriptos(usuarioId),
  ]);

  const conUbicacion = eventos.datos.filter(
    (evento): evento is Evento & { latitud: number; longitud: number } =>
      ReglasDeEvento.tieneUbicacion(evento),
  );
  const sinUbicacion = eventos.datos.length - conUbicacion.length;
  const puntosDeMapa = conUbicacion.map((evento) => ({
    id: evento.id,
    titulo: evento.titulo,
    latitud: evento.latitud,
    longitud: evento.longitud,
    detalle: `${fechaLarga(evento.fecha_hora)} · ${hora(evento.fecha_hora)}`,
    href: `/eventos/${evento.id}`,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Eventos de networking"
        descripcion="Charlas, talleres y ferias que organizan empresas e instituciones educativas. La inscripción es gratuita."
      />

      {!conSesion && (
        <InvitacionACuenta
          titulo="Creá tu cuenta para inscribirte a los eventos"
          texto="La inscripción es gratuita, y con tu cuenta ves los eventos que coinciden con tus intereses."
          siguiente="/eventos"
        />
      )}

      <AvisoOrigen resultado={eventos} />

      {puntosDeMapa.length > 0 && (
        <section aria-label="Mapa de eventos" className="space-y-2">
          <MapaInteractivo
            puntos={puntosDeMapa}
            etiqueta="Mapa de eventos"
            respaldoSinJs={
              puntosDeMapa.length === 1
                ? "1 evento con ubicación en el mapa."
                : `${puntosDeMapa.length} eventos con ubicación en el mapa.`
            }
          />
          {sinUbicacion > 0 && (
            <p className="text-[13px] text-apagado">
              {sinUbicacion === 1
                ? "1 evento no tiene ubicación en el mapa."
                : `${sinUbicacion} eventos no tienen ubicación en el mapa.`}
            </p>
          )}
        </section>
      )}

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
              esEjemplo={eventos.origen === "ejemplo"}
              conSesion={conSesion}
            />
          ))
        )}
      </section>
    </div>
  );
}
