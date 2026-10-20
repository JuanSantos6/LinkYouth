/**
 * Correo de contacto de LinkYouth.
 *
 * Es el canal de consultas mientras el formulario no tenga dónde entregar los
 * mensajes (`src/lib/acciones/consultas.ts`). Lo usan el pie, Contacto,
 * Legales y el formulario: cambiar el valor acá los cambia a todos.
 *
 * PENDIENTE: la dirección definitiva la confirma el equipo. Hasta entonces va
 * una de un dominio reservado (`.example`, RFC 2606), que no entrega nada ni
 * le pertenece a nadie: así nada sale con una dirección inventada que por
 * casualidad sí exista.
 */
export const CORREO_DE_CONTACTO = "contacto@linkyouth.example";

/** `mailto:` con un asunto, para que la consulta llegue con contexto. */
export function enlaceDeCorreo(asunto = "Consulta desde LinkYouth"): string {
  return `mailto:${CORREO_DE_CONTACTO}?subject=${encodeURIComponent(asunto)}`;
}
