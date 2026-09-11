import type { Metadata } from "next";

import { ControlesDeApariencia } from "@/components/ajustes/ControlesDeApariencia";
import { Encabezado } from "@/components/layout/Encabezado";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = { title: "Ajustes" };

export default function PaginaAjustes() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Ajustes"
        descripcion="Cómo se ve LinkYouth para vos. Las preferencias se guardan en este navegador."
      />

      <Tarjeta como="section" className="p-6">
        <ControlesDeApariencia />
      </Tarjeta>

      <p className="text-[14px] text-apagado">
        Las preferencias de cuenta —correo, contraseña y notificaciones— se van
        a sumar con el módulo de autenticación.
      </p>
    </div>
  );
}
