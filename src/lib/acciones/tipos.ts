/** Resultado que devuelve toda acción de servidor al formulario que la invocó. */
export type EstadoAccion = {
  estado: "inicial" | "ok" | "error";
  mensaje: string;
};

export const ACCION_INICIAL: EstadoAccion = { estado: "inicial", mensaje: "" };

/**
 * Única respuesta para las dos formas de no tener sesión utilizable: que no
 * haya nadie autenticado, o que falten las credenciales de Supabase y por lo
 * tanto no exista sesión posible. Al usuario le sirve la misma salida —
 * iniciar sesión— así que el texto es uno solo y vive en un solo lugar.
 */
export const SIN_SESION: EstadoAccion = {
  estado: "error",
  mensaje: "Necesitás iniciar sesión para hacer esto.",
};

/** Código de Postgres para violación de restricción única. */
export const CLAVE_DUPLICADA = "23505";
