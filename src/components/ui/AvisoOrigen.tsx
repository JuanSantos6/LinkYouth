import type { Resultado } from "@/lib/data/tipos";

/**
 * Cartel que aclara que lo que se ve es contenido de demostración, y por qué.
 *
 * Se muestra solo cuando la lectura no llegó a la base. Mostrar datos
 * inventados sin decirlo sería engañoso, y en una demo a terceros es la
 * diferencia entre una maqueta honesta y una mentira.
 *
 * La monoespaciada acá no decora: son rutas de archivo y nombres de variable
 * reales, que se copian y se pegan.
 */
export function AvisoOrigen({ resultado }: { resultado: Resultado<unknown> }) {
  if (resultado.origen === "supabase") return null;

  return (
    <div className="border-l-2 border-tinta bg-realce px-4 py-3">
      <p className="text-[14px] font-semibold text-tinta">
        Contenido de demostración
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-apagado">
        {resultado.error ?? "No se pudo leer la base de datos"}. Cargá las
        credenciales en{" "}
        <code className="font-mono text-[13px]">.env.local</code> y aplicá{" "}
        <code className="font-mono text-[13px]">db/schema.sql</code> y{" "}
        <code className="font-mono text-[13px]">db/politicas.sql</code> para ver
        datos reales.
      </p>
    </div>
  );
}
