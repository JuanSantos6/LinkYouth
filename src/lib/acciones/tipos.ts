/** Resultado que devuelve toda acción de servidor al formulario que la invocó. */
export type EstadoAccion = {
  estado: "inicial" | "ok" | "error";
  mensaje: string;
};

export const ACCION_INICIAL: EstadoAccion = { estado: "inicial", mensaje: "" };

/**
 * No hay nadie autenticado. Es el caso del `if (!user)`, después de que el
 * cliente de Supabase se creó bien.
 */
export const SIN_SESION: EstadoAccion = {
  estado: "error",
  mensaje: "Necesitás iniciar sesión para hacer esto.",
};

/**
 * Faltan las credenciales de Supabase. Es el caso del `if (!supabase)`, y no
 * se mezcla con el anterior a propósito: quien todavía no cargó `.env.local`
 * no tiene ningún inicio de sesión que hacer, y decirle que lo intente lo
 * manda a buscar el problema al lugar equivocado.
 */
export const SIN_CONFIGURAR: EstadoAccion = {
  estado: "error",
  mensaje:
    "La conexión con Supabase no está configurada. Cargá las credenciales en .env.local.",
};

/** Código de Postgres para violación de restricción única. */
export const CLAVE_DUPLICADA = "23505";
