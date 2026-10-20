export type VarianteDeIlustracion =
  "postulaciones" | "avisos" | "eventos" | "busquedas" | "personas";

/**
 * Ilustraciones chicas en SVG para los estados vacíos, dibujadas con el
 * lenguaje del isotipo (anillos, barras y trazos redondeados) y con clases de
 * tokens para seguir el tema claro y oscuro.
 */
export function Ilustracion({
  variante,
  className = "h-24 w-24",
}: {
  variante: VarianteDeIlustracion;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 96"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {variante === "postulaciones" && (
        <>
          <rect
            x="18"
            y="14"
            width="46"
            height="58"
            rx="12"
            className="fill-lavanda stroke-violeta"
            strokeWidth="4.5"
          />
          <path
            d="M30 30h22M30 42h16"
            className="stroke-borde-control"
            strokeWidth="4.5"
          />
          <path d="M52 56 62 62" className="stroke-violeta" strokeWidth="5" />
          <circle
            cx="68"
            cy="66"
            r="12"
            className="fill-superficie stroke-turquesa"
            strokeWidth="6"
          />
        </>
      )}

      {variante === "avisos" && (
        <>
          <circle cx="48" cy="50" r="32" className="fill-lavanda" />
          <path
            d="M30 58h36c-3-4-5-9-5-17a13 13 0 0 0-26 0c0 8-2 13-5 17Z"
            className="fill-superficie stroke-violeta"
            strokeWidth="5"
          />
          <path
            d="M42 66a6 6 0 0 0 12 0"
            className="stroke-borde-control"
            strokeWidth="5"
          />
          <circle
            cx="64"
            cy="28"
            r="9"
            className="fill-superficie stroke-turquesa"
            strokeWidth="5.5"
          />
        </>
      )}

      {variante === "eventos" && (
        <>
          <rect
            x="16"
            y="22"
            width="64"
            height="56"
            rx="12"
            className="fill-lavanda stroke-violeta"
            strokeWidth="4.5"
          />
          <path d="M16 38h64" className="stroke-violeta" strokeWidth="4.5" />
          <path
            d="M32 14v14M64 14v14"
            className="stroke-tinta"
            strokeWidth="5"
          />
          <circle
            cx="48"
            cy="58"
            r="10"
            className="fill-superficie stroke-turquesa"
            strokeWidth="5.5"
          />
        </>
      )}

      {variante === "busquedas" && (
        <>
          <circle cx="42" cy="42" r="28" className="fill-lavanda" />
          <path d="M57 57 76 76" className="stroke-violeta" strokeWidth="7" />
          <circle
            cx="42"
            cy="42"
            r="19"
            className="fill-superficie stroke-turquesa"
            strokeWidth="6"
          />
          <circle
            cx="42"
            cy="42"
            r="7"
            className="stroke-violeta"
            strokeWidth="4"
          />
        </>
      )}

      {variante === "personas" && (
        <>
          <circle cx="48" cy="48" r="32" className="fill-lavanda" />
          <path
            d="M36 60 60 36"
            className="stroke-borde-control"
            strokeWidth="6"
          />
          <circle
            cx="28"
            cy="68"
            r="12"
            className="fill-superficie stroke-turquesa"
            strokeWidth="6"
          />
          <circle
            cx="68"
            cy="28"
            r="12"
            className="fill-superficie stroke-violeta"
            strokeWidth="6"
          />
        </>
      )}
    </svg>
  );
}
