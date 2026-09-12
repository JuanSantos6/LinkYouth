import type { Resultado } from "@/lib/data/tipos";

/**
 * Caja de aviso: ícono, borde y color del tono «atención».
 *
 * Existe para que todo lo que la aplicación tenga que aclarar sobre sí misma
 * —datos de demostración, una función a medio conectar— se vea igual. Cuando
 * cada pantalla se arma el suyo, terminan siendo cinco avisos distintos y el
 * usuario no aprende a reconocer ninguno.
 */
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-tarjeta border border-aviso-borde bg-aviso-suave px-4 py-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aviso text-xs font-bold text-white"
      >
        i
      </span>
      <p className="text-sm text-aviso">{children}</p>
    </div>
  );
}

/**
 * Cartel que aclara que lo que se ve es contenido de demostración y por qué.
 * Se muestra solo cuando la lectura no llegó a la base: mostrar datos de
 * ejemplo sin decirlo sería engañoso.
 */
export function AvisoOrigen({ resultado }: { resultado: Resultado<unknown> }) {
  if (resultado.origen === "supabase") return null;

  return (
    <Aviso>
      <span className="font-semibold">Contenido de demostración.</span>{" "}
      {resultado.error ?? "No se pudo leer la base de datos."}. Cargá las
      credenciales en <code className="font-mono">.env.local</code> y aplicá{" "}
      <code className="font-mono">db/schema.sql</code> y{" "}
      <code className="font-mono">db/politicas.sql</code> para ver datos reales.
    </Aviso>
  );
}
