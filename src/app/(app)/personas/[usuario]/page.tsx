import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { obtenerPerfilPublico } from "@/lib/data/publico";
import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";

export const metadata: Metadata = { title: "Perfil público" };
export const dynamic = "force-dynamic";

/**
 * RF2.5 y RF2.1.1 — Perfil público de una persona, por nombre de usuario.
 *
 * Muestra únicamente lo que otra cuenta con sesión puede ver: foto (o
 * iniciales), `@nombre_usuario`, biografía e intereses. No incluye nombre,
 * apellido, edad ni país.
 */
export default async function PaginaPerfilPublico({
  params,
}: {
  params: Promise<{ usuario: string }>;
}) {
  const { usuario } = await params;
  const resultado = await obtenerPerfilPublico(decodeURIComponent(usuario));

  if (!resultado.datos) notFound();

  const persona = resultado.datos;
  const fotoUrl = rutaDeImagen(persona.foto_url);
  const bio = persona.bio?.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AvisoOrigen resultado={resultado} />

      <Tarjeta className="divide-y divide-filete">
        <header className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar nombre={persona.nombre_usuario} url={fotoUrl} tamano="lg" />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[28px] leading-tight font-extrabold text-tinta sm:text-[32px]">
              @{persona.nombre_usuario}
            </h1>
            <p className="mt-1 text-[14px] text-apagado">
              Perfil público en LinkYouth.
            </p>
          </div>
        </header>

        <section aria-labelledby="t-bio" className="space-y-2 p-6">
          <h2 id="t-bio" className="text-[18px] text-tinta">
            Presentación
          </h2>
          {bio ? (
            <p className="text-[15.5px] leading-relaxed whitespace-pre-line text-tinta">
              {bio}
            </p>
          ) : (
            <p className="text-[14px] text-apagado">
              Todavía no escribió una presentación.
            </p>
          )}
        </section>

        <section aria-labelledby="t-intereses" className="space-y-3 p-6">
          <h2 id="t-intereses" className="text-[18px] text-tinta">
            Intereses
          </h2>
          {persona.tags.length === 0 ? (
            <EstadoVacio
              nivel={3}
              titulo="Sin intereses cargados"
              descripcion="Todavía no eligió áreas de interés en su perfil."
            />
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {persona.tags.map((tag) => (
                <li key={tag}>
                  <Etiqueta>{tag}</Etiqueta>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Tarjeta>
    </div>
  );
}
