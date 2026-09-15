"use server";

import type { EstadoAccion } from "./tipos";

const LARGO_MAXIMO_MENSAJE = 1000;

/**
 * Formulario de consultas de la portada.
 *
 * **La consulta todavía no llega a ninguna parte.** No hay tabla donde
 * guardarla —`db/schema.sql` no tiene `consultas`— ni servicio de correo
 * configurado, y ninguna de las dos cosas se resuelve desde el front-end.
 *
 * La acción existe igual, y valida de verdad, por dos razones: el formulario
 * ya queda escrito contra el contrato que va a usar cuando el canal exista, y
 * —sobre todo— la pantalla puede decir la verdad. Fingir un «gracias, te
 * respondemos pronto» sobre un mensaje que se descarta es peor que no tener
 * formulario: alguien se queda esperando una respuesta que nadie va a leer.
 *
 * Para cerrarlo hace falta decidir una de dos: una tabla `consultas` con su
 * política de inserción pública, o un servicio de correo transaccional.
 */
export async function enviarConsulta(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim();
  const mensaje = String(datos.get("mensaje") ?? "").trim();

  if (nombre.length < 2) {
    return { estado: "error", mensaje: "Decinos cómo te llamás." };
  }

  // Validación deliberadamente laxa: la estricta rechaza direcciones válidas.
  // Quien se equivoca de correo se entera cuando no le llega la respuesta, no
  // peleando con el formulario.
  if (!email.includes("@") || email.length < 5) {
    return { estado: "error", mensaje: "Revisá el correo: no parece válido." };
  }

  if (mensaje.length < 10) {
    return {
      estado: "error",
      mensaje: "Contanos un poco más para poder ayudarte.",
    };
  }

  if (mensaje.length > LARGO_MAXIMO_MENSAJE) {
    return {
      estado: "error",
      mensaje: `El mensaje no puede superar los ${LARGO_MAXIMO_MENSAJE} caracteres.`,
    };
  }

  return {
    estado: "error",
    mensaje:
      "Tu consulta no se envió: todavía no hay casilla ni base donde recibirla. Por ahora escribinos por el repositorio del proyecto, que sí está abierto.",
  };
}
