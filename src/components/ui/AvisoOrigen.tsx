import type { Resultado } from "@/lib/data/tipos";

/**
 * Caja de aviso: filete a la izquierda y fondo de realce.
 *
 * Existe para que todo lo que la aplicación tenga que aclarar sobre sí misma
 * —datos de demostración, una función a medio conectar— se vea igual. Cuando
 * cada pantalla se arma el suyo, terminan siendo cinco avisos distintos y
 * nadie aprende a reconocer ninguno.
 *
 * El filete y el peso hacen el trabajo que en otra paleta haría un amarillo:
 * el ámbar de este diseño significa «acreditado» y no se presta para otra
 * cosa.
 */
export function Aviso({
  titulo,
  children,
}: {
  titulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-tinta bg-realce px-4 py-3">
      {titulo && (
        <p className="text-[14px] font-semibold text-tinta">{titulo}</p>
      )}
      <p className="mt-1 text-[14px] leading-relaxed text-apagado">
        {children}
      </p>
    </div>
  );
}

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
    <Aviso titulo="Contenido de demostración">
      {resultado.error ?? "No se pudo leer la base de datos"}. Cargá las
      credenciales en <code className="font-mono text-[13px]">.env.local</code>{" "}
      y aplicá <code className="font-mono text-[13px]">db/schema.sql</code> y{" "}
      <code className="font-mono text-[13px]">db/politicas.sql</code> para ver
      datos reales.
    </Aviso>
  );
}
