/**
 * Estructura de las pantallas de autenticación: una sola columna centrada,
 * sin la barra lateral de la aplicación. Quien todavía no inició sesión no
 * tiene adónde navegar.
 */
export default function LayoutAuth({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      {children}
    </div>
  );
}
