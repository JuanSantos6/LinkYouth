import "server-only";

import { createClient } from "@/lib/supabase/server";

import { SIN_CREDENCIALES, ejemplo } from "./comun";
import { obtenerVacantes } from "./consultas";
import type { ReseniaRecibida, Resultado, Vacante } from "./tipos";

/** Lo que cualquiera ve de una empresa (RF2.5, RF8.2). */
export type PerfilDeOrganizacion = {
  id: string;
  razon_social: string;
  rubro: string;
  descripcion: string | null;
  logo_url: string | null;
  sitio_web: string | null;
  vacantes: Vacante[];
  resenias: ReseniaRecibida[];
  /** Si la sesión es de un joven que puede reseñarla y todavía no lo hizo. */
  puedeReseniar: boolean;
};

/**
 * RF2.5 y RF8.2 — Perfil público de una empresa: sus datos, sus búsquedas
 * activas y sus reseñas, sin quién las escribió (`resenias_de_empresa`).
 * `null` si no existe o la cuenta fue eliminada.
 */
export async function obtenerOrganizacion(
  id: string,
): Promise<Resultado<PerfilDeOrganizacion | null>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(null, SIN_CREDENCIALES);

  const { data: empresa, error } = await supabase
    .from("empresas")
    .select("id, razon_social, rubro, descripcion, logo_url, sitio_web")
    .eq("id", id)
    .maybeSingle();
  if (error) return ejemplo(null, error.message);
  if (!empresa) return { datos: null, origen: "supabase" };

  const [{ data: resenias }, vacantes, usuario] = await Promise.all([
    supabase.rpc("resenias_de_empresa", { empresa: id }),
    obtenerVacantes({ limite: 50 }),
    supabase.auth.getUser(),
  ]);

  // Puede reseñar quien se postuló a alguna de sus búsquedas y todavía no
  // la reseñó. Es la misma condición que la política de insert; acá solo
  // decide si se muestra el formulario.
  let puedeReseniar = false;
  const yo = usuario.data.user?.id;
  if (yo) {
    const [{ count: postulaciones }, { count: propias }] = await Promise.all([
      supabase
        .from("postulaciones")
        .select("id, vacantes!inner(empresa_id)", {
          count: "exact",
          head: true,
        })
        .eq("perfil_id", yo)
        .eq("vacantes.empresa_id", id),
      supabase
        .from("resenias")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", yo)
        .eq("empresa_id", id),
    ]);
    puedeReseniar = (postulaciones ?? 0) > 0 && (propias ?? 0) === 0;
  }

  return {
    datos: {
      ...empresa,
      vacantes:
        vacantes.origen === "supabase"
          ? vacantes.datos.filter((v) => v.empresa.id === id)
          : [],
      resenias: resenias ?? [],
      puedeReseniar,
    },
    origen: "supabase",
  };
}

/** Lo que otra persona con sesión ve de un joven (RF2.5, RF2.1.1). */
export type PerfilPublico = {
  id: string;
  nombre_usuario: string;
  foto_url: string | null;
  bio: string | null;
  tags: string[];
};

/**
 * RF2.5 — Perfil público de una persona, por nombre de usuario. Solo con
 * sesión: `perfil_publico()` no está abierta a `anon`. `null` si no existe.
 */
export async function obtenerPerfilPublico(
  usuario: string,
): Promise<Resultado<PerfilPublico | null>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(null, SIN_CREDENCIALES);

  const { data, error } = await supabase.rpc("perfil_publico", { usuario });
  if (error) return ejemplo(null, error.message);
  return { datos: data?.[0] ?? null, origen: "supabase" };
}
