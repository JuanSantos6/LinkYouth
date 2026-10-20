"use client";

import Link from "next/link";

import { BotonAccion } from "@/components/ui/BotonAccion";
import { marcarAvisosLeidos } from "@/lib/acciones/avisos";
import type { EstadoAccion } from "@/lib/acciones/tipos";

async function marcarAviso(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const id = String(datos.get("id") ?? "").trim();
  return marcarAvisosLeidos(id || undefined);
}

/**
 * RF6.1 — Marcar todos los avisos sin leer de la sesión de una vez.
 */
export function BotonMarcarTodosLeidos({
  esEjemplo = false,
}: {
  esEjemplo?: boolean;
}) {
  return (
    <BotonAccion
      accion={marcarAviso}
      campo="id"
      valor=""
      variante="secundario"
      esEjemplo={esEjemplo}
      textos={{
        inicial: "Marcar todo como leído",
        enCurso: "Marcando…",
        hecho: "Todo leído",
        ejemplo: "Marcar todo como leído",
      }}
    />
  );
}

/**
 * RF6.1 — Marcar un aviso individual como leído con un clic.
 */
export function BotonMarcarAvisoLeido({
  id,
  esEjemplo = false,
}: {
  id: string;
  esEjemplo?: boolean;
}) {
  return (
    <BotonAccion
      accion={marcarAviso}
      campo="id"
      valor={id}
      variante="fantasma"
      esEjemplo={esEjemplo}
      textos={{
        inicial: "Marcar como leído",
        enCurso: "Marcando…",
        hecho: "Leído",
        ejemplo: "Marcar como leído",
      }}
    />
  );
}

const DESTINOS: readonly [prefijo: string, etiqueta: string][] = [
  ["/postulaciones", "Ver la postulación"],
  ["/empresa/busquedas", "Ver a la persona"],
  ["/empresa/eventos", "Ver el evento"],
  ["/eventos", "Ver el evento"],
];

function textoDelEnlace(href: string): string {
  return DESTINOS.find(([prefijo]) => href.startsWith(prefijo))?.[1] ?? "Abrir";
}

/**
 * Enlace al destino del aviso: dice a dónde lleva según la ruta y, si estaba
 * sin leer, tocarlo también lo marca como leído en segundo plano.
 */
export function EnlaceDeAviso({
  id,
  href,
  leida,
  esEjemplo = false,
}: {
  id: string;
  href: string;
  leida: boolean;
  esEjemplo?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (!leida && !esEjemplo) {
          void marcarAvisosLeidos(id);
        }
      }}
      className="inline-flex min-h-11 shrink-0 items-center rounded-control px-3 py-2 text-[14px] font-medium text-acento transition-colors duration-150 hover:bg-realce hover:underline"
    >
      {textoDelEnlace(href)}
    </Link>
  );
}
