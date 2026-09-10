import { redirect } from "next/navigation";

/**
 * La raíz entra directo al feed. Cuando exista la autenticación (RF1.3), acá
 * se decide entre la pantalla pública y el panel según haya sesión o no.
 */
export default function Home() {
  redirect("/inicio");
}
