type Tono = "neutro" | "exito" | "aviso" | "alerta" | "primario";

const TONOS: Record<Tono, string> = {
  neutro: "border-borde bg-superficie-suave text-tinta-media",
  exito: "border-exito-borde bg-exito-suave text-exito",
  aviso: "border-aviso-borde bg-aviso-suave text-aviso",
  alerta: "border-alerta-borde bg-alerta-suave text-alerta",
  primario: "border-primario-borde bg-primario-suave text-primario-fuerte",
};

/** Marca de estado: modalidad, tipo de contrato, estado de una postulación. */
export function Insignia({
  children,
  tono = "neutro",
}: {
  children: React.ReactNode;
  tono?: Tono;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}
