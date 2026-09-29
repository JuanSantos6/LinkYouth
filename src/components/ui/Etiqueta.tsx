/**
 * Un tag o una habilidad.
 *
 * `coincide` marca lo que el perfil ya declara: turquesa (el del logo, en su
 * versión suave en tema claro) con una marca de verificación y un texto
 * oculto para lectores de pantalla. El color nunca va solo (WCAG 1.4.1).
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
      <span className="inline-flex items-center rounded-full border border-borde-control/60 bg-superficie px-2.5 py-0.5 text-[13px] text-tinta">
        {children}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-coincide-borde bg-coincide-fondo px-2.5 py-0.5 text-[13px] font-semibold text-sobre-turquesa">
      <span aria-hidden="true">✓</span>
      {children}
      <span className="sr-only"> (ya lo tenés)</span>
    </span>
  );
}
