import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormularioDeBusqueda } from "@/components/empresa/FormularioDeBusqueda";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerCatalogos } from "@/lib/data/consultas";
import { obtenerBusqueda } from "@/lib/data/empresa";
import { ReglasDeBusqueda } from "@/lib/dominio/ReglasDeBusqueda";

export const metadata: Metadata = { title: "Editar búsqueda" };
export const dynamic = "force-dynamic";

/** RF3.2 — Editar una búsqueda propia. Cerrada no se edita: vuelve al detalle. */
export default async function PaginaEditarBusqueda({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resultado, catalogos] = await Promise.all([
    obtenerBusqueda(id),
    obtenerCatalogos(),
  ]);
  if (!resultado) notFound();

  const busqueda = resultado.datos;
  if (!ReglasDeBusqueda.puedeEditar(busqueda.estado)) {
    redirect(`/empresa/busquedas/${busqueda.id}`);
  }

  const esEjemplo =
    resultado.origen === "ejemplo" || catalogos.origen === "ejemplo";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresa/busquedas/${busqueda.id}`}
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← Volver a la búsqueda
      </Link>
      <Encabezado
        titulo="Editar búsqueda"
        descripcion="Quienes ya se postularon siguen en el proceso: los cambios se ven en la publicación desde que los guardás."
      />
      <AvisoOrigen
        resultado={resultado.origen === "ejemplo" ? resultado : catalogos}
      />
      <div className="rounded-tarjeta border border-borde bg-superficie p-5 sm:p-8">
        <FormularioDeBusqueda
          busqueda={busqueda}
          catalogos={catalogos.datos}
          esEjemplo={esEjemplo}
        />
      </div>
    </div>
  );
}
