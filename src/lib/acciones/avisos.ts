"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { type EstadoAccion, SIN_CONFIGURAR, SIN_SESION } from "./tipos";

/**
 * RF6.1 — Marcar avisos como leídos: uno (`id`) o todos los de la sesión.
 * La política deja tocar solo los propios y el permiso de columna, solo
 * `leida` (migración 006). Sirve para las dos cuentas.
 */
export async function marcarAvisosLeidos(id?: string): Promise<EstadoAccion> {
  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  let consulta = supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("cuenta_id", user.id)
    .eq("leida", false);
  if (id) consulta = consulta.eq("id", id);

  const { error } = await consulta;
  if (error) {
    return { estado: "error", mensaje: "No se pudieron marcar los avisos." };
  }

  revalidatePath("/", "layout");
  return { estado: "ok", mensaje: "" };
}
