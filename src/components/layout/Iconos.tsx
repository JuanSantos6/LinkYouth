type IconoProps = { className?: string };

/**
 * Íconos de la navegación. Van en línea y no como librería: son unos pocos trazos
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

export function IconoInicio(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </Base>
  );
}

export function IconoEmpleos(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M3 12h18" />
    </Base>
  );
}

export function IconoEventos(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Base>
  );
}

export function IconoPostulaciones(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 13.5l2 2 4-4" />
    </Base>
  );
}

export function IconoPerfil(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
    </Base>
  );
}

export function IconoBusqueda(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Base>
  );
}

export function IconoUbicacion(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Base>
  );
}

export function IconoAvisos(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3.2.8 4.7 1.5 5.5H5c.7-.8 1.5-2.3 1.5-5.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </Base>
  );
}

export function IconoAjustes(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.25" />
      <circle cx="9" cy="17" r="2.25" />
    </Base>
  );
}

export function IconoCodigo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </Base>
  );
}

export function IconoCorreo(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </Base>
  );
}

export function IconoSalir(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M14.5 4.5h-8v15h8" />
      <path d="M12 12h8m0 0-3-3m3 3-3 3" />
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
