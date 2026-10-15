import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormularioDeEvento } from "@/components/empresa/FormularioDeEvento";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerCatalogos } from "@/lib/data/consultas";
import { obtenerEventoDeEmpresa } from "@/lib/data/empresa";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";

export const metadata: Metadata = { title: "Editar evento" };
export const dynamic = "force-dynamic";

/** RF4.2 — Editar un evento propio, mientras no haya pasado ni esté cancelado. */
export default async function PaginaEditarEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resultado, catalogos] = await Promise.all([
    obtenerEventoDeEmpresa(id),
    obtenerCatalogos(),
  ]);
  if (!resultado) notFound();

  const evento = resultado.datos;
  if (!ReglasDeEvento.puedeModificar(evento)) {
    redirect(`/empresa/eventos/${evento.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresa/eventos/${evento.id}`}
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← Volver al evento
      </Link>
      <Encabezado
        titulo="Editar evento"
        descripcion="Si cambiás el día o el lugar, avisales a los inscriptos en la descripción: la plataforma solo les avisa si lo cancelás."
      />
      <AvisoOrigen
        resultado={resultado.origen === "ejemplo" ? resultado : catalogos}
      />
      <div className="rounded-tarjeta border border-borde bg-superficie p-5 sm:p-8">
        <FormularioDeEvento
          evento={evento}
          tags={catalogos.datos.tags}
          minimo={ReglasDeEvento.aHoraLocal(new Date().toISOString())}
          esEjemplo={
            resultado.origen === "ejemplo" || catalogos.origen === "ejemplo"
          }
        />
      </div>
    </div>
  );
}
