import { BotonEnlace } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { conSiguiente } from "@/lib/navegacion";

/**
 * Invitación a crear cuenta para quien explora sin sesión.
 *
 * No es un muro: el listado se ve completo debajo. Dice qué se gana entrando
 * —la compatibilidad, postularse, inscribirse— y ofrece las dos puertas, las
 * dos con la vuelta a esta misma pantalla.
 */
export function InvitacionACuenta({
  titulo,
  texto,
  siguiente,
}: {
  titulo: string;
  texto: string;
  /** Ruta a la que se vuelve después de crear la cuenta o entrar. */
  siguiente: string;
}) {
  return (
    <Tarjeta
      como="aside"
      aria-label="Crear una cuenta"
      className="flex flex-col gap-4 border-l-[3px] border-l-acento p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-[16px] font-medium text-tinta">{titulo}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-apagado">{texto}</p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <BotonEnlace
          href={conSiguiente("/registro", siguiente)}
          variante="primario"
        >
          Crear mi cuenta
        </BotonEnlace>
        <BotonEnlace href={conSiguiente("/login", siguiente)}>
          Ya tengo cuenta
        </BotonEnlace>
      </div>
    </Tarjeta>
  );
}

/**
 * El botón de postularse o inscribirse, para quien no tiene sesión.
 *
 * Mismo texto que el botón real —«Postularme», «Inscribirme»— porque es la
 * misma intención; lo que cambia es que lleva a crear la cuenta y, hecho eso,
 * de vuelta a esta vacante o a este evento para terminar lo que empezó.
 */
export function AccionConCuenta({
  etiqueta,
  siguiente,
  variante = "primario",
}: {
  etiqueta: string;
  siguiente: string;
  variante?: "primario" | "secundario";
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <BotonEnlace
        href={conSiguiente("/registro", siguiente)}
        variante={variante}
      >
        {etiqueta}
      </BotonEnlace>
      <p className="text-[12px] text-apagado">Te pedimos crear una cuenta.</p>
    </div>
  );
}
