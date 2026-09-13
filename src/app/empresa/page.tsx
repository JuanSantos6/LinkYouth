import type { Metadata } from "next";

import { Encabezado } from "@/components/layout/Encabezado";
import { EstadoVacio } from "@/components/ui/EstadoVacio";

export const metadata: Metadata = { title: "Panel de empresa" };

export default function PaginaEmpresa() {
  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Panel de empresa"
        descripcion="Desde acá vas a publicar búsquedas y revisar quién se postula."
      />

      <EstadoVacio
        titulo="En construcción"
        descripcion="El panel completo —publicar vacantes, ver postulantes ordenados por compatibilidad y responder reseñas— llega en el Hito 6. Por ahora tu cuenta de empresa quedó creada y podés iniciar sesión."
      />
    </div>
  );
}
