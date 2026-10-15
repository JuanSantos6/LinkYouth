import type { Metadata } from "next";

import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { obtenerPanelDeEmpresa } from "@/lib/data/empresa";
import { ResumenDePanel } from "@/lib/dominio/ResumenDePanel";
import {
  etiquetaTipo,
  fechaBloque,
  fechaLarga,
  hora,
  tiempoRelativo,
} from "@/lib/formato";

export const metadata: Metadata = { title: "Panel de empresa" };
export const dynamic = "force-dynamic";

/**
 * Panel de empresa (RF7), con lo que ya funciona: las búsquedas y los eventos
 * publicados, leídos de la base, y cuántas postulaciones recibió cada
 * búsqueda. Publicar y responder postulaciones todavía no están programados
 * (RF3.1, RF3.4): aparecen como pendientes, sin botones que no hacen nada.
 */
export default async function PaginaEmpresa() {
  const resultado = await obtenerPanelDeEmpresa();
  const panel = resultado.datos;
  const resumen = new ResumenDePanel(panel);

  const metricas = [
    { valor: resumen.busquedasActivas.length, texto: "búsquedas activas" },
    { valor: resumen.posicionesAbiertas, texto: "posiciones abiertas" },
    { valor: resumen.postulantesNuevos, texto: "postulantes nuevos" },
    { valor: resumen.eventosProximos.length, texto: "eventos próximos" },
  ];

  return (
    <div className="space-y-8">
      <Encabezado
        titulo={`Hola, ${panel.empresa.razon_social}`}
        descripcion="Esto es lo que tenés publicado en LinkYouth."
      />

      <AvisoOrigen resultado={resultado} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricas.map(({ valor, texto }) => (
          <li
            key={texto}
            className="rounded-tarjeta border border-borde bg-superficie px-5 py-4"
          >
            <span className="cifra block text-[34px] text-tinta">{valor}</span>
            <span className="mt-1 block text-[14px] text-apagado">{texto}</span>
          </li>
        ))}
      </ul>

      <section
        id="busquedas"
        aria-labelledby="t-busquedas"
        className="scroll-mt-24 space-y-3"
      >
        <h2 id="t-busquedas" className="text-[22px] text-tinta">
          Tus búsquedas
        </h2>

        {panel.busquedas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no publicaste búsquedas"
            descripcion="Por ahora las búsquedas se cargan con el equipo de LinkYouth. Escribinos desde Contacto y la publicamos con vos."
          />
        ) : (
          <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie">
            <table className="w-full min-w-[620px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-borde text-[13px] text-apagado">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Búsqueda
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-semibold"
                  >
                    Posiciones
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-semibold"
                  >
                    Postulaciones
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Publicada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-filete">
                {panel.busquedas.map((vacante) => (
                  <tr key={vacante.id}>
                    <th
                      scope="row"
                      className="px-5 py-3.5 font-semibold text-tinta"
                    >
                      {vacante.titulo}
                    </th>
                    <td className="px-5 py-3.5 text-tinta">
                      {etiquetaTipo(vacante.tipo)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-tinta">
                      {vacante.posiciones}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-tinta">
                      {vacante.postulaciones}
                    </td>
                    <td className="px-5 py-3.5">
                      <Insignia
                        tono={
                          vacante.estado === "activa" ? "acreditado" : "apagado"
                        }
                      >
                        {vacante.estado === "activa" ? "Activa" : "Cerrada"}
                      </Insignia>
                    </td>
                    <td className="px-5 py-3.5 text-apagado">
                      {tiempoRelativo(vacante.creada_en)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        id="eventos"
        aria-labelledby="t-eventos"
        className="scroll-mt-24 space-y-3"
      >
        <h2 id="t-eventos" className="text-[22px] text-tinta">
          Tus eventos
        </h2>

        {panel.eventos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no publicaste eventos"
            descripcion="Los talleres y charlas que organices para jóvenes van a aparecer acá."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {panel.eventos.map((evento) => {
              const { dia, mes } = fechaBloque(evento.fecha_hora);
              return (
                <li
                  key={evento.id}
                  className="flex items-center gap-4 rounded-tarjeta border border-borde bg-superficie p-4"
                >
                  <span className="flex h-[60px] w-14 shrink-0 flex-col items-center justify-center rounded-ficha bg-lavanda">
                    <span className="cifra text-[24px] text-tinta">{dia}</span>
                    <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-acento">
                      {mes}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-tinta">
                      {evento.titulo}
                    </span>
                    <span className="block text-[13.5px] text-apagado">
                      <time dateTime={evento.fecha_hora}>
                        {fechaLarga(evento.fecha_hora)}
                      </time>
                      , {hora(evento.fecha_hora)}
                      {evento.estado === "cancelado" ? ", cancelado" : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="t-pendiente"
        className="space-y-2 rounded-tarjeta border-[1.5px] border-dashed border-borde-control/70 p-5"
      >
        <h2 id="t-pendiente" className="text-[17px] text-tinta">
          Lo que viene en el panel
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-[14.5px] text-apagado">
          <li>Publicar y editar búsquedas desde acá (RF3.1 y RF3.2).</li>
          <li>Ver quién se postuló a cada búsqueda y responder (RF3.4).</li>
        </ul>
        <p className="text-[14px] text-apagado">
          Mientras tanto, las búsquedas se cargan con el equipo de LinkYouth.
        </p>
      </section>
    </div>
  );
}
