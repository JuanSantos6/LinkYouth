import type { Metadata } from "next";

import { FormularioDePerfilDeEmpresa } from "@/components/empresa/FormularioDePerfilDeEmpresa";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerEmpresaPropia } from "@/lib/data/empresa";

export const metadata: Metadata = { title: "Perfil de la empresa" };
export const dynamic = "force-dynamic";

/** RF7.1 — El perfil público de la empresa. */
export default async function PaginaPerfilDeEmpresa() {
  const resultado = await obtenerEmpresaPropia();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Perfil de la empresa"
        descripcion="Es lo que ven los jóvenes en cada búsqueda y evento que publicás."
      />
      <AvisoOrigen resultado={resultado} />
      <div className="rounded-tarjeta border border-borde bg-superficie p-5 sm:p-8">
        <FormularioDePerfilDeEmpresa
          empresa={resultado.datos}
          esEjemplo={resultado.origen === "ejemplo"}
        />
      </div>
    </div>
  );
}
