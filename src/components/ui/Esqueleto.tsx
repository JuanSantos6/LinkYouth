/**
 * Esqueleto de carga: la silueta de lo que viene, con un brillo suave, en vez
 * de una pantalla en blanco mientras la base responde (la navegación ronda los
 * 800 ms: `docs/decisiones.md`, 2026-09-13). Lo usan los `loading.tsx` de
 * Next. Con «reducir movimiento», la silueta queda quieta.
 */
export function EsqueletoDePantalla({
  tarjetas = 3,
  columnas = false,
}: {
  tarjetas?: number;
  /** Detalle: contenido a la izquierda y acción a la derecha. */
  columnas?: boolean;
}) {
  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-4xl space-y-6">
      <span className="sr-only">Cargando…</span>
      <div className="space-y-3" aria-hidden="true">
        <div className="esqueleto h-9 w-2/3 max-w-md" />
        <div className="esqueleto h-4 w-5/6 max-w-xl" />
      </div>

      {columnas ? (
        <div
          aria-hidden="true"
          className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]"
        >
          <div className="space-y-4">
            <div className="esqueleto h-4 w-full" />
            <div className="esqueleto h-4 w-11/12" />
            <div className="esqueleto h-4 w-4/5" />
          </div>
          <div className="esqueleto h-56 rounded-tarjeta" />
        </div>
      ) : (
        <ul aria-hidden="true" className="grid gap-3">
          {Array.from({ length: tarjetas }, (_, indice) => (
            <li
              key={indice}
              className="flex gap-4 rounded-tarjeta border border-borde bg-superficie p-5 sm:p-6"
            >
              <div className="esqueleto h-12 w-12 shrink-0 rounded-ficha" />
              <div className="flex-1 space-y-3">
                <div className="esqueleto h-3.5 w-1/3" />
                <div className="esqueleto h-5 w-2/3" />
                <div className="esqueleto h-3.5 w-full" />
                <div className="flex gap-2">
                  <div className="esqueleto h-6 w-20 rounded-full" />
                  <div className="esqueleto h-6 w-24 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
