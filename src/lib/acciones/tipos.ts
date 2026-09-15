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
 * Hay sesión, pero no es una cuenta de postulante con perfil creado.
 *
 * Es el caso del guardia de `sesion.ts`, y va separado de `SIN_SESION` por lo
 * mismo que `SIN_CONFIGURAR`: decirle «iniciá sesión» a alguien que ya la
 * tiene lo manda a buscar el problema al lugar equivocado.
 *
 * Cubre dos situaciones que para quien mira la pantalla son la misma —no se
 * puede seguir— y que no vale la pena distinguir con una consulta más: una
 * cuenta de empresa invocando una acción de postulante, y un alta a medio
 * terminar que todavía no tiene fila en `perfiles`.
 */
export const SIN_PERFIL: EstadoAccion = {
  estado: "error",
  mensaje:
    "Esta acción es para cuentas de postulante. Si te registraste recién, terminá de crear tu perfil antes de usarla.",
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

/**
 * Código de Postgres para «la fila viola una política de RLS».
 *
 * Es la red de abajo del guardia de `sesion.ts`: si una escritura llega igual
 * a la base y la política la rechaza, el mensaje que devuelve Postgres nombra
 * la tabla y la política. Eso no sale a la pantalla.
 */
export const POLITICA_RLS = "42501";
