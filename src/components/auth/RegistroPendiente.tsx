import { IconoCorreo } from "@/components/layout/Iconos";

/**
 * Lo que se ve cuando el registro salió bien pero la cuenta todavía no está
 * confirmada.
 *
 * Reemplaza al formulario en lugar de convivir con él. Antes, la acción
 * devolvía `estado: "ok"` y el formulario se limpiaba: quedaba una pantalla de
 * campos vacíos con una línea verde arriba del botón, que se lee como «no pasó
 * nada, probá de nuevo» y no como «listo, andá a tu correo». Un registro no se
 * reintenta: crear la cuenta dos veces choca contra el correo duplicado.
 *
 * El texto del cuerpo lo escribe la acción de servidor —cambia entre cuenta
 * individual y de empresa— así que llega como `mensaje` y no se duplica acá.
 *
 * Sin enlace a `/login`: la página de registro ya tiene uno justo debajo, y dos
 * «Iniciá sesión» seguidos no agregan nada.
 */
export function RegistroPendiente({
  email,
  mensaje,
}: {
  email: string;
  mensaje: string;
}) {
  return (
    <div className="py-2 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primario-suave text-primario"
      >
        <IconoCorreo className="h-6 w-6" />
      </span>

      <h2 className="mt-4 text-base font-bold text-tinta">Revisá tu correo</h2>

      {email && (
        <p className="mt-2 text-sm text-tinta-media">
          Te lo enviamos a{" "}
          <span className="font-semibold text-tinta">{email}</span>.
        </p>
      )}

      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-tinta-suave">
        {mensaje}
      </p>
    </div>
  );
}
