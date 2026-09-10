type EtiquetaProps = {
  children: React.ReactNode;
  /**
   * `neutra` para un tag de habilidad, `coincide` cuando el postulante ya
   * tiene ese tag en su perfil. La diferencia se apoya en color y en texto,
   * nunca solo en color.
   */
  tono?: "neutra" | "coincide";
};

/** Tag de habilidad. Es el átomo más repetido de la interfaz. */
export function Etiqueta({ children, tono = "neutra" }: EtiquetaProps) {
  const estilos =
    tono === "coincide"
      ? "border-primario-borde bg-primario-suave text-primario-fuerte"
      : "border-borde bg-superficie-suave text-tinta-media";

  return (
    <span
      className={`inline-flex items-center rounded-control border px-2 py-0.5 text-xs font-medium ${estilos}`}
    >
      {tono === "coincide" && (
        <span className="mr-1" aria-hidden="true">
          ✓
        </span>
      )}
      {children}
      {tono === "coincide" && <span className="sr-only"> (ya lo tenés)</span>}
    </span>
  );
}
