import { BotonEnlace } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
import type { TestDeInterviewLab } from "@/lib/dominio/InterviewLab";
import { fechaConAnio } from "@/lib/formato";

/**
 * Un test del Interview Lab: nombre, qué mide, cuánto lleva, si está
 * pendiente o completado y el botón que lo abre en su sitio, en otra
 * pestaña. Abajo, `children`: la carga del resultado.
 *
 * El obligatorio va destacado (borde de acento) y, mientras está pendiente,
 * su botón es el principal de la pantalla: la única mandarina.
 */
export function TarjetaDeTest({
  test,
  completadoEl,
  children,
}: {
  test: TestDeInterviewLab;
  completadoEl: string | null;
  children: React.ReactNode;
}) {
  const principal = test.obligatorio && !completadoEl;

  return (
    <section
      id={`test-${test.clave}`}
      aria-labelledby={`titulo-${test.clave}`}
      className={`scroll-mt-28 space-y-4 rounded-tarjeta border bg-superficie p-5 sm:p-6 ${
        test.obligatorio ? "border-2 border-acento" : "border-borde"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={`titulo-${test.clave}`}
              className="text-[19px] leading-tight font-bold text-tinta"
            >
              {test.nombre}
            </h2>
            <Insignia tono={test.obligatorio ? "acento" : "apagado"}>
              {test.obligatorio ? "Obligatorio" : "Opcional"}
            </Insignia>
          </div>
          <p className="text-[13.5px] text-apagado">
            {test.sitio} · Unos {test.minutos} minutos · Gratis
          </p>
        </div>
        {completadoEl ? (
          <Insignia tono="acreditado">
            Completado el {fechaConAnio(completadoEl)}
          </Insignia>
        ) : (
          <Insignia>Pendiente</Insignia>
        )}
      </div>

      <p className="max-w-[60ch] text-[15px] text-tinta">{test.descripcion}</p>

      <BotonEnlace
        href={test.url}
        target="_blank"
        rel="noopener noreferrer"
        variante={principal ? "primario" : "secundario"}
      >
        {completadoEl ? "Volver a hacer el test" : "Hacer el test"}
        <span aria-hidden="true">↗</span>
        <span className="sr-only"> (se abre en una pestaña nueva)</span>
      </BotonEnlace>

      {children}
    </section>
  );
}
