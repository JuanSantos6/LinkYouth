import { colorDeAvatar } from "@/lib/diseno/avatar";
import { iniciales } from "@/lib/formato";
import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";
import { esDeUnsplash, urlConTamanio } from "@/lib/unsplash";

type AvatarProps = {
  nombre: string;
  url?: string | null;
  /** Identificador de la cuenta para que el color sea estable aunque cambie el nombre. */
  semilla?: string;
  tamano?: "xs" | "sm" | "md" | "lg";
  /** `cuadrado` para logos institucionales, `redondo` para personas. */
  forma?: "redondo" | "cuadrado";
};

const TAMANOS = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-[14px]",
  lg: "h-20 w-20 text-xl",
} as const;

/**
 * El mismo lado en píxeles que fija cada clase de `TAMANOS`. Va como atributo
 * `width`/`height` de la imagen: las clases reservan el espacio recién cuando
 * llegó la hoja de estilos, el atributo lo reserva desde el HTML.
 */
const LADOS = { xs: 28, sm: 36, md: 48, lg: 80 } as const;

/**
 * Avatar con reserva de espacio para la foto. Cuando no hay imagen cargada
 * muestra las iniciales sobre el color de `colorDeAvatar(semilla ?? nombre)`,
 * así ninguna cuenta queda sin imagen y la grilla nunca cambia de alto.
 */
export function Avatar({
  nombre,
  url,
  semilla,
  tamano = "md",
  forma = "redondo",
}: AvatarProps) {
  const radio = forma === "redondo" ? "rounded-full" : "rounded-ficha";
  const color = colorDeAvatar(semilla ?? nombre);
  const clases = `${TAMANOS[tamano]} ${radio} ${color.fondo} shrink-0 border border-borde object-cover`;

  const ruta = rutaDeImagen(url);
  // Las de Unsplash se piden al doble del lado (pantallas densas), recortadas
  // a las caras. Su crédito está en `/legales#fotos`: en 28–80 px no entra.
  const src = esDeUnsplash(ruta)
    ? urlConTamanio(ruta, LADOS[tamano] * 2, {
        alto: LADOS[tamano] * 2,
        encuadre: forma === "redondo" ? "caras" : "entropia",
      })
    : ruta;

  if (src) {
    // Los logos y las fotos viven en Supabase Storage, con dominios variables:
    // no pasan por el optimizador de imágenes de Next.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={nombre}
        width={LADOS[tamano]}
        height={LADOS[tamano]}
        loading="lazy"
        className={clases}
      />
    );
  }

  return (
    <span
      className={`${clases} ${color.texto} flex items-center justify-center font-titulo font-bold`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
