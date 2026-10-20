import type { Metadata } from "next";

import { IconoCorreo } from "@/components/layout/Iconos";
import { CORREO_DE_CONTACTO, enlaceDeCorreo } from "@/lib/contacto";

export const metadata: Metadata = { title: "Contacto" };

/**
 * Contacto, en versión simple y honesta.
 *
 * El canal es el correo de `src/lib/contacto.ts`. Antes había un formulario
 * que no entregaba los mensajes a nadie —no hay tabla ni servicio de correo
 * donde recibirlos— y un enlace al repositorio en GitHub. Las dos cosas se
 * sacaron (Etapa 2): un formulario que parece enviar y no envía deja a alguien
 * esperando una respuesta que no va a llegar, y el código fuente no es un
 * canal de atención. Cuando exista dónde recibir consultas, el formulario se
 * recupera del historial de git.
 */
export default function PaginaContacto() {
  return (
    <article className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-[34px] leading-tight font-extrabold text-tinta">
          Contacto
        </h1>
        <p className="text-[17px] leading-relaxed text-apagado">
          LinkYouth es un proyecto de estudiantes y todavía está en piloto. Te
          contamos cómo escribirnos, sin vueltas.
        </p>
      </header>

      <section
        aria-labelledby="t-canal"
        className="space-y-3 rounded-tarjeta bg-lavanda p-6"
      >
        <h2 id="t-canal" className="text-[22px] text-tinta">
          Escribinos por correo
        </h2>
        <p className="text-[16px] leading-relaxed text-tinta/85">
          Lo lee el equipo y te responde a la misma dirección desde la que nos
          escribiste.
        </p>
        <a
          href={enlaceDeCorreo()}
          className="inline-flex items-center gap-2 rounded-control bg-mandarina px-4 py-2.5 text-[15px] font-semibold text-sobre-mandarina transition-[filter] duration-150 hover:brightness-[0.94]"
        >
          <IconoCorreo className="h-4 w-4" />
          {CORREO_DE_CONTACTO}
        </a>
      </section>

      <section
        id="empresas"
        aria-labelledby="t-empresas"
        className="scroll-mt-24 space-y-3"
      >
        <h2 id="t-empresas" className="text-[22px] text-tinta">
          Contacto comercial
        </h2>
        <p className="text-[16px] leading-relaxed text-apagado">
          Si representás a una empresa, podés crear tu cuenta y publicar tus
          búsquedas y eventos vos mismo. Si preferís que te acompañemos, o
          querés hablar de un convenio, escribinos al mismo correo contándonos
          qué necesitás. Durante el piloto no tiene costo.
        </p>
        <a
          href={enlaceDeCorreo("Consulta comercial desde LinkYouth")}
          className="inline-flex text-[15px] font-semibold text-acento underline-offset-4 hover:underline"
        >
          Escribir una consulta comercial
        </a>
      </section>
    </article>
  );
}
