/**
 * Los dos anillos del isotipo que se unen: la única «celebración» de la app,
 * cuando una postulación o una inscripción se envía. Medio segundo, y el
 * texto de al lado dice lo mismo. Con «reducir movimiento», ya aparece unido.
 */
export function ConexionAnillos() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="conexion-anillos h-9 w-9 shrink-0"
      fill="none"
      strokeLinecap="round"
    >
      <defs>
        <linearGradient
          id="ly-conexion"
          x1="12"
          y1="52"
          x2="52"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#19DDD2" />
          <stop offset=".5" stopColor="#4BA8ED" />
          <stop offset="1" stopColor="#8C66FA" />
        </linearGradient>
      </defs>
      <circle
        className="anillo-1"
        cx="14"
        cy="50"
        r="8"
        stroke="url(#ly-conexion)"
        strokeWidth="7"
      />
      <path
        className="barra"
        d="M20 44 44 20"
        stroke="url(#ly-conexion)"
        strokeWidth="7"
        strokeDasharray="40"
      />
      <circle
        className="anillo-2"
        cx="50"
        cy="14"
        r="8"
        stroke="url(#ly-conexion)"
        strokeWidth="7"
      />
    </svg>
  );
}
