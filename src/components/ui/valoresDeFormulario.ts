import type { EstadoFormulario } from "@/lib/acciones/tipos";

/**
 * Qué mostrar en cada campo de un formulario largo: lo que se mandó, si la
 * acción lo devolvió con un error, o lo guardado, si todavía no se mandó nada.
 *
 * Ver `EstadoFormulario` en `src/lib/acciones/tipos.ts`: sin esto, un solo
 * campo mal cargado le borraría a la persona todo lo que escribió.
 */
export function valoresDeFormulario(estado: EstadoFormulario) {
  const enviados = estado.valores;

  return {
    texto(campo: string, guardado: string): string {
      if (!enviados) return guardado;
      const valor = enviados[campo];
      return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
    },
    lista(campo: string, guardados: string[]): string[] {
      if (!enviados) return guardados;
      const valor = enviados[campo];
      return valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];
    },
  };
}
