type Tono = "neutro" | "acento" | "acreditado" | "apagado";

const TONOS: Record<Tono, string> = {
  neutro: "border-borde-control/70 bg-superficie text-tinta",
  acento: "border-acento/50 bg-lavanda text-acento",
  /**
   * Turquesa: lo que ya está logrado —una postulación aceptada—. Es el mismo
   * color que marca «ya lo tenés» en las etiquetas, y siempre va con palabra.
   */
  acreditado:
    "border-coincide-borde bg-coincide-fondo text-sobre-turquesa font-semibold",
  apagado: "border-borde text-apagado",
};

/**
 * Marca de estado: tipo de oportunidad, estado de una postulación o de un
 * estudio. Siempre lleva la palabra; el color acompaña, no reemplaza.
 */
export function Insignia({
  children,
  tono = "neutro",
}: {
  children: React.ReactNode;
  tono?: Tono;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[13px] ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}
