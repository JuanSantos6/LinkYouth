import type { Metadata } from "next";
import Link from "next/link";

import { FormularioDeBusqueda } from "@/components/empresa/FormularioDeBusqueda";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerCatalogos } from "@/lib/data/consultas";

export const metadata: Metadata = { title: "Publicar búsqueda" };
export const dynamic = "force-dynamic";

/** RF3.1 — Publicar una búsqueda. */
export default async function PaginaNuevaBusqueda() {
  const catalogos = await obtenerCatalogos();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/empresa/busquedas"
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← Mis búsquedas
      </Link>
      <Encabezado
        titulo="Publicar una búsqueda"
        descripcion="Se publica apenas la guardes. Después la podés editar, pausar o cerrar cuando quieras."
      />
      <AvisoOrigen resultado={catalogos} />
      <div className="rounded-tarjeta border border-borde bg-superficie p-5 sm:p-8">
        <FormularioDeBusqueda
          catalogos={catalogos.datos}
          esEjemplo={catalogos.origen === "ejemplo"}
        />
      </div>
    </div>
  );
}
