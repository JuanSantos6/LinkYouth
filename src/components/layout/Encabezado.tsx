/** Encabezado de sección: título y bajada. */
export function Encabezado({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
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
    </header>
  );
}
