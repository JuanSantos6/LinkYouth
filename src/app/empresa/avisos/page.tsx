import type { Metadata } from "next";

import { BandejaDeAvisos } from "@/components/avisos/BandejaDeAvisos";
import { obtenerAvisos, obtenerUsuarioId } from "@/lib/data/consultas";

export const metadata: Metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

/**
 * Bandeja de avisos de la empresa (RF6.1).
 *
 * Las filas las crean los disparadores de la base cuando alguien se postula a
 * una búsqueda o se inscribe a un evento de la empresa.
 */
export default async function PaginaAvisosDeEmpresa() {
  const avisos = await obtenerAvisos((await obtenerUsuarioId()) ?? undefined);

  return (
    <BandejaDeAvisos
      avisos={avisos}
      descripcion="Las postulaciones e inscripciones que recibieron tus búsquedas y eventos, de lo más reciente a lo más viejo."
      descripcionVacia="Cuando alguien se postule a una de tus búsquedas o se inscriba a un evento, te avisamos acá."
    />
  );
}
