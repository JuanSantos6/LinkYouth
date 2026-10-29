import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { createClient } from "@/lib/supabase/server";

/**
 * El aviso del panel cuando la imagen elegida al registrarse no se pudo
 * guardar (`user_metadata.imagen_fallida`, ver `imagenPendiente.ts`). El
 * registro se completó igual; esto dice qué falta y a dónde ir. Desaparece
 * cuando la persona sube una imagen desde su perfil.
 */
export async function AvisoDeImagenFallida({
  area,
}: {
  area: "postulante" | "empresa";
}) {
  const supabase = await createClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: null };
  if (data?.user?.user_metadata?.imagen_fallida !== true) return null;

  return (
    <aside
      aria-label="Imagen del perfil"
      className="flex flex-wrap items-center justify-between gap-3 rounded-tarjeta border border-acento/40 bg-lavanda px-5 py-4"
    >
      <p className="max-w-[56ch] text-[14.5px] text-tinta">
        No pudimos guardar tu imagen; podés subirla desde tu perfil.
      </p>
      <EnlaceTransicion
        href={area === "empresa" ? "/empresa/perfil" : "/perfil"}
        className="text-[14.5px] font-semibold text-acento underline-offset-4 hover:underline"
      >
        Ir a mi perfil
      </EnlaceTransicion>
    </aside>
  );
}
