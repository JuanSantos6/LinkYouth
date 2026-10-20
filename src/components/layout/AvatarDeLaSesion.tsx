import { Suspense } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { obtenerIdentidadDeSesion } from "@/lib/data/consultas";

import { IconoPerfil } from "./Iconos";

function RespaldoAvatarDeSesion() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lavanda">
      <IconoPerfil className="h-4 w-4" />
    </span>
  );
}

async function AvatarConIdentidad() {
  const identidad = await obtenerIdentidadDeSesion();
  if (!identidad) return <RespaldoAvatarDeSesion />;

  return (
    <Avatar
      nombre={identidad.nombre}
      url={identidad.url}
      semilla={identidad.id}
      tamano="xs"
      forma={identidad.forma}
    />
  );
}

/**
 * El avatar de quien tiene la sesión en el botón del menú de la cuenta (28 px).
 *
 * Igual que `CampanaDeAvisosDeLaSesion`: la lectura va dentro de su propio
 * `Suspense` con `IconoPerfil` en lavanda como respaldo, para que
 * `CabeceraGlobal` siga siendo síncrona y no aparezcan errores de hidratación.
 */
export function AvatarDeLaSesion() {
  return (
    <Suspense fallback={<RespaldoAvatarDeSesion />}>
      <AvatarConIdentidad />
    </Suspense>
  );
}
