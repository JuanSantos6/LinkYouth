import type { Metadata } from "next";

import { FormularioConsulta } from "@/components/landing/FormularioConsulta";

export const metadata: Metadata = { title: "Contacto" };

const REPOSITORIO = "https://github.com/JuanSantos6/LinkYouth/issues";

/**
 * Contacto, en versión simple y honesta.
 *
 * Todavía no hay casilla de correo ni tabla donde recibir consultas
 * (`src/lib/acciones/consultas.ts`). El canal que sí funciona hoy es el
 * repositorio del proyecto, y la página lo dice primero. El formulario queda
 * con su aviso, escrito contra el contrato que va a usar cuando exista el
 * canal. Cuando el equipo tenga un correo, va arriba de todo.
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
          contamos cómo escribirnos hoy, sin vueltas.
        </p>
      </header>

      <section
        aria-labelledby="t-canal"
        className="space-y-3 rounded-tarjeta bg-lavanda p-6"
      >
        <h2 id="t-canal" className="text-[22px] text-tinta">
          La vía que funciona hoy
        </h2>
        <p className="text-[16px] leading-relaxed text-tinta/85">
          Abrí una consulta en el repositorio del proyecto: la lee el equipo y
          te responde ahí mismo. Necesitás una cuenta gratuita de GitHub.
        </p>
        <a
          href={REPOSITORIO}
          className="inline-flex rounded-control bg-mandarina px-4 py-2.5 text-[15px] font-semibold text-sobre-mandarina transition-[filter] duration-150 hover:brightness-[0.94]"
        >
          Escribir en el repositorio
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
          Si representás a una empresa y querés publicar una búsqueda u
          organizar un evento, escribinos por el mismo canal y contanos el
          puesto o la actividad. Durante el piloto no tiene costo.
        </p>
      </section>

      <section aria-labelledby="t-formulario" className="space-y-4">
        <h2 id="t-formulario" className="text-[22px] text-tinta">
          Formulario de consultas
        </h2>
        <FormularioConsulta />
      </section>
    </article>
  );
}
