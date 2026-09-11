type Tono = "neutro" | "acento" | "acreditado" | "apagado";

const TONOS: Record<Tono, string> = {
  neutro: "border-borde text-tinta",
  acento: "border-acento text-acento",
  /**
   * El ámbar. Aparece en dos lugares de toda la aplicación —el canto de la
   * vacante destacada y la postulación aceptada— y en ninguno más: es lo que
   * lo mantiene siendo una señal.
   */
  acreditado: "border-senal bg-senal-tenue text-tinta",
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
      className={`inline-flex items-center rounded-control border px-2 py-0.5 text-[13px] ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}
