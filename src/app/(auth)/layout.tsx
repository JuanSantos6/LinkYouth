/**
 * Fondo de las pantallas de acceso: el papel de siempre con dos formas muy
 * suaves de los colores del logo —turquesa abajo a la izquierda, violeta
 * arriba a la derecha— y los dos anillos del isotipo, apenas visibles. Usa la
 * marca con moderación: la protagonista es la tarjeta.
 *
 * La tarjeta (`TarjetaDeAcceso`) la arma cada pantalla, porque el registro
 * es más ancho que el login.
 */
export default function LayoutAuth({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative isolate flex min-h-dvh overflow-hidden bg-papel">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-turquesa opacity-[0.16] blur-[110px]" />
        <div className="absolute -top-44 -right-40 h-[560px] w-[560px] rounded-full bg-violeta opacity-[0.16] blur-[120px]" />
        <svg
          viewBox="0 0 400 400"
          className="absolute top-[12%] left-[6%] h-40 w-40 opacity-[0.12]"
          fill="none"
        >
          <circle
            cx="200"
            cy="200"
            r="150"
            strokeWidth="46"
            className="stroke-turquesa"
          />
        </svg>
        <svg
          viewBox="0 0 400 400"
          className="absolute right-[7%] bottom-[10%] h-28 w-28 opacity-[0.12]"
          fill="none"
        >
          <circle
            cx="200"
            cy="200"
            r="150"
            strokeWidth="46"
            className="stroke-violeta"
          />
        </svg>
      </div>

      <main className="relative mx-auto flex w-full flex-1 items-center justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
