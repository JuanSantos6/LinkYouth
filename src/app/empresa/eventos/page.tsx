import type { Metadata } from "next";
import Link from "next/link";

import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { BotonEnlace } from "@/components/ui/Boton";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { FiltroDeslizante } from "@/components/ui/FiltroDeslizante";
import { Insignia } from "@/components/ui/Insignia";
import { obtenerEventosDeEmpresa } from "@/lib/data/empresa";
import {
  MOMENTOS_DE_EVENTO,
  type MomentoDeEvento,
  ReglasDeEvento,
} from "@/lib/dominio/ReglasDeEvento";
import { fechaBloque, fechaLarga, hora } from "@/lib/formato";

export const metadata: Metadata = { title: "Mis eventos" };
export const dynamic = "force-dynamic";

const ETIQUETA: Record<MomentoDeEvento, string> = {
  proximo: "Próximos",
  pasado: "Pasados",
  cancelado: "Cancelados",
};

const VACIO: Record<MomentoDeEvento, { titulo: string; texto: string }> = {
  proximo: {
    titulo: "No tenés eventos próximos",
    texto:
      "Una charla o un taller es la forma más directa de que los jóvenes te conozcan antes de postularse.",
  },
  pasado: {
    titulo: "Todavía no pasó ninguno de tus eventos",
    texto: "Los eventos que ya ocurrieron quedan acá, con sus inscriptos.",
  },
  cancelado: {
    titulo: "No cancelaste ningún evento",
    texto: "Si cancelás uno, queda acá y les avisamos a los inscriptos.",
  },
};

/**
 * Mis eventos (RF4): próximos, pasados y cancelados, cada uno con cuántas
 * personas se inscribieron. Los pasados y cancelados no se borran: son el
 * historial de la empresa con los jóvenes.
 */
export default async function PaginaEventos({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  const { ver } = await searchParams;
  const momento: MomentoDeEvento = (
    MOMENTOS_DE_EVENTO as readonly string[]
  ).includes(ver ?? "")
    ? (ver as MomentoDeEvento)
    : "proximo";

  const resultado = await obtenerEventosDeEmpresa();
  const ahora = new Date();
  const eventos = resultado.datos.filter(
    (e) => ReglasDeEvento.momento(e, ahora) === momento,
  );
  // Los próximos, del más cercano al más lejano; el resto, al revés.
  if (momento !== "proximo") eventos.reverse();

  const opciones = MOMENTOS_DE_EVENTO.map((m) => ({
    href: m === "proximo" ? "/empresa/eventos" : `/empresa/eventos?ver=${m}`,
    etiqueta: ETIQUETA[m],
    activa: m === momento,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Encabezado
        titulo="Mis eventos"
        descripcion="Charlas, talleres y visitas que organizás para jóvenes, con quiénes se anotaron."
        acciones={
          <BotonEnlace href="/empresa/eventos/nuevo" variante="primario">
            Crear evento
          </BotonEnlace>
        }
      />

      <AvisoOrigen resultado={resultado} />

      {resultado.datos.length === 0 ? (
        <EstadoVacio
          nivel={2}
          ilustracion="eventos"
          titulo="Todavía no creaste eventos"
          descripcion="Contá de qué se trata, cuándo y dónde. Los jóvenes lo ven en Eventos y se inscriben desde ahí."
          accion={
            <BotonEnlace href="/empresa/eventos/nuevo">
              Crear el primero
            </BotonEnlace>
          }
        />
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <FiltroDeslizante etiqueta="Qué eventos ver" opciones={opciones} />
          </div>

          {eventos.length === 0 ? (
            <EstadoVacio
              nivel={2}
              ilustracion="eventos"
              titulo={VACIO[momento].titulo}
              descripcion={VACIO[momento].texto}
            />
          ) : (
            <ul className="grid gap-3">
              {eventos.map((evento) => {
                const { dia, mes } = fechaBloque(evento.fecha_hora);
                return (
                  <li
                    key={evento.id}
                    className="relative flex items-center gap-4 rounded-tarjeta border border-borde bg-superficie p-4 transition-shadow duration-150 hover:shadow-elevada sm:p-5"
                  >
                    <span className="flex h-[64px] w-14 shrink-0 flex-col items-center justify-center rounded-ficha bg-lavanda">
                      <span className="cifra text-[24px] text-tinta">
                        {dia}
                      </span>
                      <span className="mt-1 text-[11px] font-bold tracking-wide text-acento uppercase">
                        {mes}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/empresa/eventos/${evento.id}`}
                        className="block text-[17px] font-semibold text-tinta underline-offset-4 after:absolute after:inset-0 hover:underline"
                      >
                        {evento.titulo}
                      </Link>
                      <span className="mt-0.5 block text-[13.5px] text-apagado">
                        <time dateTime={evento.fecha_hora}>
                          {fechaLarga(evento.fecha_hora)}
                        </time>
                        , {hora(evento.fecha_hora)}
                        {evento.direccion && ` · ${evento.direccion}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {evento.estado === "cancelado" ? (
                        <Insignia tono="apagado">Cancelado</Insignia>
                      ) : (
                        <span className="text-[14px] text-tinta">
                          <span className="cifra font-bold">
                            {evento.inscriptos}
                          </span>{" "}
                          {evento.inscriptos === 1 ? "inscripto" : "inscriptos"}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
