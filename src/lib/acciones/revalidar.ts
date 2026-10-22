import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Las tres pantallas que muestran el Interview Lab: el lab, el perfil (la
 * personalidad, de solo lectura) y el inicio (el aviso del obligatorio).
 *
 * Vive fuera de los archivos `"use server"` a propósito: todo lo que esos
 * archivos exportan queda invocable desde el navegador como acción.
 */
export function revalidarInterviewLab() {
  revalidatePath("/interview-lab");
  revalidatePath("/perfil");
  revalidatePath("/inicio");
}
