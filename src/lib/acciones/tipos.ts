/** Resultado que devuelve toda acción de servidor al formulario que la invocó. */
export type EstadoAccion = {
  estado: "inicial" | "ok" | "error";
  mensaje: string;
};

export const ACCION_INICIAL: EstadoAccion = { estado: "inicial", mensaje: "" };

export const SIN_SESION: EstadoAccion = {
  estado: "error",
  mensaje:
    "Necesitás iniciar sesión para hacer esto. El módulo de autenticación (RF1.3) todavía no está implementado.",
};

/** Código de Postgres para violación de restricción única. */
export const CLAVE_DUPLICADA = "23505";
