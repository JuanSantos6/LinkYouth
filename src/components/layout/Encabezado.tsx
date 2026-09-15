/**
 * Encabezado de pantalla: título, bajada y acciones a la derecha.
 *
 * Sin rótulo en versalitas encima del título. Es el tic que delata una
 * plantilla y, sobre todo, no agrega información: el título ya dice dónde
 * estás.
 */
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
        <h1 className="text-[26px] leading-tight text-tinta">{titulo}</h1>
        {descripcion && (
          <p className="mt-1.5 max-w-2xl text-[15px] text-apagado">
            {descripcion}
          </p>
        )}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </header>
  );
}
