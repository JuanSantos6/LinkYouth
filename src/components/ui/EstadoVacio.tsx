import { imagenDeLugar } from "@/lib/data/fotos";
import { urlConTamanio } from "@/lib/unsplash";

import { Ilustracion, type VarianteDeIlustracion } from "./Ilustracion";

/**
 * Qué se ve cuando una lista viene vacía.
 *
 * Nunca un blanco: siempre qué pasó y qué se puede hacer. El borde punteado
 * dice «acá va a haber algo» sin fingir que hay contenido.
 *
 * La imagen es la foto de Unsplash del lugar `vacio:<ilustracion>` si
 * `scripts/fotos/` eligió una (2026-10-22), con su crédito al pie; si no, la
 * ilustración propia. Por eso es asíncrono: solo se usa desde Server
 * Components.
 */
export async function EstadoVacio({
  titulo,
  descripcion,
  accion,
  nivel = 3,
  ilustracion = "personas",
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
  /**
   * Nivel del título. 3 dentro de una sección con su `h2`; 2 cuando la lista
   * vacía cuelga directo del `h1` de la pantalla, para no saltear niveles.
   */
  nivel?: 1 | 2 | 3;
  ilustracion?: VarianteDeIlustracion;
}) {
  const Titulo = `h${nivel}` as const;
  const foto = await imagenDeLugar(`vacio:${ilustracion}`, null);

  return (
    <div className="rounded-tarjeta border border-dashed border-borde-control/70 bg-superficie px-6 py-12 text-center">
      {foto ? (
        <figure className="mx-auto mb-5 w-full max-w-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- hotlink de Unsplash */}
          <img
            src={urlConTamanio(foto.src, 560, { alto: 360 })}
            alt=""
            width={280}
            height={180}
            loading="lazy"
            decoding="async"
            style={foto.color ? { backgroundColor: foto.color } : undefined}
            className="aspect-[14/9] w-full rounded-ficha object-cover"
          />
          {foto.credito && (
            <figcaption className="mt-1.5 text-[11.5px] text-apagado">
              Foto de{" "}
              <a
                href={foto.credito.autorEnlace}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {foto.credito.autor}
              </a>{" "}
              en{" "}
              <a
                href={foto.credito.unsplashEnlace}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Unsplash
              </a>
            </figcaption>
          )}
        </figure>
      ) : (
        <Ilustracion
          variante={ilustracion}
          className="mx-auto mb-4 h-24 w-24"
        />
      )}
      <Titulo className="text-[16px] font-semibold text-tinta">{titulo}</Titulo>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-apagado">
        {descripcion}
      </p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
