import type { Metadata } from "next";

import { BandejaDeAvisos } from "@/components/avisos/BandejaDeAvisos";
import { obtenerAvisos, obtenerUsuarioId } from "@/lib/data/consultas";

export const metadata: Metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

/**
 * Bandeja de avisos del joven (RF6.1, RF6.2).
 *
 * Las filas las crea la base cuando una empresa mueve el estado de una
 * postulación o cancela un evento. Desde acá solo se actualiza `leida`:
 * `notificaciones` no tiene política de insert, y así queda claro que ningún
 * cliente puede fabricar un aviso.
 */
export default async function PaginaAvisos() {
  const avisos = await obtenerAvisos((await obtenerUsuarioId()) ?? undefined);

  return (
    <BandejaDeAvisos
      avisos={avisos}
      descripcion="Lo que pasó con tus postulaciones, de lo más reciente a lo más viejo."
      descripcionVacia="Cuando una empresa mueva alguna de tus postulaciones, te avisamos acá."
    />
  );
}
