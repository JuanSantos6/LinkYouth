type IconoProps = { className?: string };

/**
 * Íconos de la portada (cámara de las fotos provisorias y código del pie). Van en línea y no como librería: son unos pocos trazos
 * y así no viaja un paquete entero al navegador. Todos comparten grilla de
 * 24 px, trazo de 1.75 y puntas redondeadas, que es lo que los hace leer como
 * un conjunto.
 */
function Base({
  className = "h-[18px] w-[18px]",
  children,
}: IconoProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconoCodigo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </Base>
  );
}

export function IconoCamara(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3.5 8.5h3l1.5-2.5h8l1.5 2.5h3v10h-17z" />
      <circle cx="12" cy="13" r="3.25" />
    </Base>
  );
}
