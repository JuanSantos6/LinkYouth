import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";
import {
  type CreditoDeFoto as Credito,
  esDeUnsplash,
  urlConTamanio,
} from "@/lib/unsplash";

import { CreditoDeFoto } from "./Foto";

/**
 * La foto guardada en una fila (la de un evento, la portada de una empresa):
 * de Storage, o de Unsplash por hotlink en el tamaño justo y con su crédito
 * encima. La foto va en un contenedor `relative` con `className`, y el
 * crédito, posicionado contra él, queda por encima de un enlace estirado
 * sobre la tarjeta (`z-10` en `CreditoDeFoto`).
 */
export function FotoConCredito({
  url,
  alt,
  ancho,
  alto,
  credito,
  className = "",
}: {
  url: string | null;
  alt: string;
  ancho: number;
  alto: number;
  credito?: Credito | null;
  className?: string;
}) {
  const ruta = rutaDeImagen(url);
  if (!ruta) return null;
  const src = esDeUnsplash(ruta) ? urlConTamanio(ruta, ancho, { alto }) : ruta;

  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Storage o hotlink de Unsplash, fuera del optimizador */}
      <img
        src={src}
        alt={alt}
        width={ancho}
        height={alto}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      {credito && <CreditoDeFoto credito={credito} />}
    </div>
  );
}
