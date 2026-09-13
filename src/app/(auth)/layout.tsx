/**
 * Estructura de las pantallas de autenticación: una sola columna centrada,
 * sin la barra lateral de la aplicación. Quien todavía no inició sesión no
 * tiene adónde navegar.
 *
 * Es un `<main>` y no un `<div>`: sin el landmark, el contenido queda fuera
 * de toda región y un lector de pantalla no puede saltar al contenido.
 */
export default function LayoutAuth({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      {children}
    </main>
  );
}
