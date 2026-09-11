/** Clase compartida por todos los campos de texto de la aplicación. */
export const CAMPO =
  "w-full rounded-control border border-borde bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-tenue focus:border-primario focus:outline-none";

/**
 * Etiqueta, campo y texto de ayuda. El `<label>` envuelve al control, así que
 * el foco llega al hacer clic en el texto sin necesidad de `htmlFor`.
 */
export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-tinta">{etiqueta}</span>
      {children}
      {ayuda && (
        <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>
      )}
    </label>
  );
}
