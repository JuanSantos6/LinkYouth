import type { Metadata } from "next";

import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { obtenerReseniasRecibidas } from "@/lib/data/empresa";
import { ResumenDeResenias } from "@/lib/dominio/ResumenDeResenias";
import { tiempoRelativo } from "@/lib/formato";

export const metadata: Metadata = { title: "Reseñas recibidas" };
export const dynamic = "force-dynamic";

/** Cinco estrellas dibujadas, con el número dicho en palabras para quien no las ve. */
function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="sr-only">{valor} de 5</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${n <= valor ? "fill-violeta" : "fill-borde"}`}
        >
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Reseñas recibidas (RF7.4): lo que escribieron los jóvenes sobre la
 * empresa, sin su nombre. Una reseña con nombre frente a la empresa reseñada
 * es la forma más rápida de que nadie escriba una honesta.
 */
export default async function PaginaResenias() {
  const resultado = await obtenerReseniasRecibidas();
  const resumen = new ResumenDeResenias(resultado.datos);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Reseñas recibidas"
        descripcion="Lo que cuentan los jóvenes de su experiencia con tu empresa. Son anónimas."
      />

      <AvisoOrigen resultado={resultado} />

      {resumen.total === 0 ? (
        <EstadoVacio
          nivel={2}
          titulo="Todavía no recibiste reseñas"
          descripcion="Las escriben los jóvenes que pasaron por un proceso o un evento con tu empresa. Cuando llegue la primera, la vas a ver acá."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-tarjeta border border-borde bg-superficie p-5">
            <span className="cifra text-[40px] leading-none text-tinta">
              {resumen.promedioTexto}
            </span>
            <span className="space-y-1">
              <Estrellas valor={Math.round(resumen.promedio)} />
              <span className="block text-[14px] text-apagado">
                Promedio de{" "}
                {resumen.total === 1 ? "1 reseña" : `${resumen.total} reseñas`}
              </span>
            </span>
          </div>

          <ul className="divide-y divide-filete border-y border-filete">
            {resultado.datos.map((resenia) => (
              <li key={resenia.id} className="space-y-2 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Estrellas valor={resenia.calificacion} />
                  <span className="text-[13px] text-apagado">
                    {tiempoRelativo(resenia.creada_en)}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-tinta">
                  {resenia.comentario}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
