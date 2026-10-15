/** Resultado que devuelve toda acción de servidor al formulario que la invocó. */
export type EstadoAccion = {
  estado: "inicial" | "ok" | "error";
  mensaje: string;
};

export const ACCION_INICIAL: EstadoAccion = { estado: "inicial", mensaje: "" };

/**
 * El resultado de un formulario largo: además del mensaje, qué campo hay que
 * corregir y lo que se había escrito.
 *
 * `valores` existe por cómo funciona React 19: cuando termina la acción de un
 * `<form action>`, React restaura cada campo a su `defaultValue`. Si el
 * formulario usa como `defaultValue` lo que devolvió la acción, el error deja
 * todo como estaba; si no, la persona pierde lo que escribió por un solo campo
 * mal cargado.
 */
export type EstadoFormulario = EstadoAccion & {
  campos?: Partial<Record<string, string>>;
  valores?: Record<string, string | string[]>;
};

export const FORMULARIO_INICIAL: EstadoFormulario = ACCION_INICIAL;

/** Lo que se mandó, sin archivos, para devolverlo con un error. */
export function valoresDe(datos: FormData): Record<string, string | string[]> {
  const valores: Record<string, string | string[]> = {};
  for (const clave of new Set(datos.keys())) {
    const todos = datos
      .getAll(clave)
      .filter((v): v is string => typeof v === "string");
    if (todos.length === 0) continue;
    valores[clave] = todos.length === 1 ? todos[0] : todos;
  }
  return valores;
}

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
 * Hay sesión, pero no es una cuenta de empresa con su fila creada. Mismo
 * criterio que `SIN_PERFIL`, del otro lado.
 */
export const SIN_EMPRESA: EstadoAccion = {
  estado: "error",
  mensaje:
    "Esta acción es para cuentas de empresa. Si te registraste recién, iniciá sesión de nuevo para terminar el alta.",
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
