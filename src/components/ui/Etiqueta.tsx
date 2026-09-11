/**
 * Un tag o una habilidad.
 *
 * `coincide` marca lo que el perfil ya declara, con una marca de verificación
 * y más peso, nunca con color de relleno: en una vacante que pide seis cosas y
 * la persona tiene cinco, seis etiquetas pintadas dejan de ser una señal y
 * pasan a ser un fondo. El ámbar se reserva para lo que aparece una vez por
 * pantalla.
 */
export function Etiqueta({
  children,
  coincide = false,
}: {
  children: React.ReactNode;
  coincide?: boolean;
}) {
  if (!coincide) {
    return (
      <span className="inline-flex items-center rounded-control border border-borde px-2 py-0.5 text-[13px] text-apagado">
        {children}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-control border border-tinta px-2 py-0.5 text-[13px] font-medium text-tinta">
      <span aria-hidden="true">✓</span>
      {children}
      <span className="sr-only"> (ya lo tenés)</span>
    </span>
  );
}
