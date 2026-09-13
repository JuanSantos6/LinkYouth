import { cerrarSesion } from "@/lib/acciones/auth";

/**
 * Estructura del panel de empresa.
 *
 * Deliberadamente mínima: una columna centrada y el cierre de sesión. El panel
 * real —vacantes propias, postulantes ordenados por matching— es el Hito 6. Lo
 * único que esta ruta tiene que sostener hoy es que una cuenta de empresa
 * aterrice en algún lado propio al iniciar sesión, y no en el feed del
 * postulante.
 *
 * No reusa `(app)/layout.tsx` porque la barra lateral lista las cinco secciones
 * del postulante, ninguna de las cuales le sirve a una empresa.
 */
export default function LayoutEmpresa({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-control bg-primario text-sm font-bold text-white"
          >
            LY
          </span>
          <span className="text-base font-bold tracking-tight text-tinta">
            LinkYouth
          </span>
        </span>

        <form action={cerrarSesion}>
          <button
            type="submit"
            className="rounded-control px-3 py-2 text-sm font-medium text-tinta-media transition-colors duration-150 hover:bg-superficie-suave hover:text-tinta"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main>{children}</main>
    </div>
  );
}
