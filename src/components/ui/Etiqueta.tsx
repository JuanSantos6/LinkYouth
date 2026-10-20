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
  marcada,
}: {
  children: React.ReactNode;
  coincide?: boolean;
  /**
   * Marca en el color de acento, con ✓ y este texto para lectores de pantalla.
   * Es la que usan las pantallas de empresa: ahí el turquesa no se usa en las
   * habilidades, porque son declaradas y ese color dice «logrado».
   */
  marcada?: string;
}) {
  if (marcada) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-acento/60 bg-lavanda px-2.5 py-0.5 text-[13px] font-semibold text-acento">
        <span aria-hidden="true">✓</span>
        {children}
        <span className="sr-only"> ({marcada})</span>
      </span>
    );
  }

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
