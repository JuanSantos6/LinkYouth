import type { CompletitudDeFicha } from "@/lib/dominio/CompletitudDeFicha";

/**
 * Guía de arriba del perfil: qué le falta a la ficha y por qué importa.
 * La barra y el texto dicen lo mismo («3 de 4 pasos»); cada paso lleva una
 * marca distinta según esté hecho o no, además del color.
 */
export function GuiaDeFicha({
  completitud,
}: {
  completitud: CompletitudDeFicha;
}) {
  const { hechos, total, completa, pasos } = completitud;

  return (
    <section
      aria-labelledby="guia-ficha"
      className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="guia-ficha" className="text-[18px] text-tinta">
          {completa ? "Tu ficha está completa" : "Tu ficha está casi lista"}
        </h2>
        <span className="text-[14px] text-apagado">
          {hechos} de {total} pasos
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={hechos}
        aria-label="Pasos completos de tu ficha"
        className="h-2 overflow-hidden rounded-full border border-borde bg-realce"
      >
        <div
          className="h-full rounded-full bg-tinta transition-[width] duration-300"
          style={{ width: `${(hechos / total) * 100}%` }}
        />
      </div>

      <ul className="grid gap-1.5 text-[14.5px]">
        {pasos.map((paso) => (
          <li key={paso.clave} className="flex items-start gap-2.5">
            {paso.hecho ? (
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-turquesa text-[11px] font-extrabold text-sobre-turquesa"
              >
                ✓
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-acento"
              />
            )}
            <span className={paso.hecho ? "text-apagado" : "text-tinta"}>
              <span className="sr-only">
                {paso.hecho ? "Hecho: " : "Falta: "}
              </span>
              {paso.hecho ? paso.logrado : paso.pendiente}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
