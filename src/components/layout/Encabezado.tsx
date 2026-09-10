/** Encabezado de sección: título, bajada y acciones a la derecha. */
export function Encabezado({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-tinta">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
            {descripcion}
          </p>
        )}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </header>
  );
}
