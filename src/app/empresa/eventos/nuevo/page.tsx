import type { Metadata } from "next";
import Link from "next/link";

import { FormularioDeEvento } from "@/components/empresa/FormularioDeEvento";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerCatalogos } from "@/lib/data/consultas";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";

export const metadata: Metadata = { title: "Crear evento" };
export const dynamic = "force-dynamic";

/** RF4.1 — Crear un evento. */
export default async function PaginaNuevoEvento() {
  const catalogos = await obtenerCatalogos();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/empresa/eventos"
        className="inline-flex text-[14px] font-medium text-acento underline-offset-4 hover:underline"
      >
        ← Mis eventos
      </Link>
      <Encabezado
        titulo="Crear un evento"
        descripcion="Se publica apenas lo guardes y los jóvenes lo ven en Eventos."
      />
      <AvisoOrigen resultado={catalogos} />
      <div className="rounded-tarjeta border border-borde bg-superficie p-5 sm:p-8">
        <FormularioDeEvento
          tags={catalogos.datos.tags}
          minimo={ReglasDeEvento.aHoraLocal(new Date().toISOString())}
          esEjemplo={catalogos.origen === "ejemplo"}
        />
      </div>
    </div>
  );
}
