import Link from "next/link";

import { EstadoVacio } from "@/components/ui/EstadoVacio";

/**
 * Una búsqueda, postulación o evento que no existe o no es de esta empresa.
 * Las dos cosas se ven igual a propósito: decir «existe, pero no es tuyo»
 * ya sería contar algo de otra empresa.
 */
export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-xl">
      <EstadoVacio
        titulo="No encontramos lo que buscabas"
        descripcion="Puede que se haya eliminado, que el enlace esté incompleto o que no sea de tu empresa."
        accion={
          <Link
            href="/empresa"
            className="text-[14px] font-medium text-acento hover:underline"
          >
            Volver al panel
          </Link>
        }
      />
    </div>
  );
}
