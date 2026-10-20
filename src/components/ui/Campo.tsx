/** Clase compartida por todos los campos de texto de la aplicación. */
/**
 * Clase compartida por todos los campos de texto de la aplicación.
 *
 * Sin `focus:outline-none`: esa utilidad vive en la capa `utilities` y pisaba
 * el `:focus-visible` de `globals.css`, así que el foco de teclado quedaba
 * reducido a un cambio de color de borde de 1 px.
 */
export const CAMPO =
  "w-full rounded-control border border-borde-control bg-superficie px-3 py-2.5 text-[15px] text-tinta placeholder:text-apagado transition-[border-color] duration-150 focus:border-acento";

/**
 * Etiqueta, campo y texto de ayuda. El `<label>` envuelve al control, así que
 * el foco llega al hacer clic en el texto sin necesidad de `htmlFor`.
 */
export function Campo({
  etiqueta,
  ayuda,
  error,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  /**
   * Lo que hay que corregir en este campo. Va dentro del `<label>`, así que un
   * lector de pantalla lo lee junto con el nombre del campo al enfocarlo, y
   * reemplaza a la ayuda: dos textos debajo del campo compiten por atención.
   */
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-tinta">{etiqueta}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[13px] font-medium text-alerta">
          {error}
        </span>
      ) : (
        ayuda && (
          <span className="mt-1 block text-[13px] text-apagado">{ayuda}</span>
        )
      )}
    </label>
  );
}
