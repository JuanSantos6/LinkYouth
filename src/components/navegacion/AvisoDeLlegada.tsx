"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  PARAMETRO_AVISO,
  TEXTO_DE_AVISO,
  esAvisoDeLlegada,
  type AvisoDeLlegada as Aviso,
} from "@/lib/navegacion";

/**
 * Aviso amable al llegar desde la pestaña del login que no correspondía:
 * «Tu cuenta es de empresa, así que te llevamos a tu panel». Aparece arriba,
 * con un fundido, lo anuncia un lector de pantalla (`role="status"`), se
 * puede cerrar y se va solo a los 7 segundos. Saca el parámetro de la URL
 * para que no vuelva a aparecer al recargar.
 */
export function AvisoDeLlegada() {
  const parametros = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const valor = parametros.get(PARAMETRO_AVISO);
    if (!esAvisoDeLlegada(valor)) return;
    setAviso(valor);
    requestAnimationFrame(() => setVisible(true));

    const limpios = new URLSearchParams(parametros.toString());
    limpios.delete(PARAMETRO_AVISO);
    const consulta = limpios.toString();
    router.replace(`${ruta}${consulta ? `?${consulta}` : ""}`, {
      scroll: false,
    });
  }, [parametros, ruta, router]);

  useEffect(() => {
    if (!visible) return;
    const reloj = window.setTimeout(() => setVisible(false), 7000);
    return () => window.clearTimeout(reloj);
  }, [visible]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
    >
      {aviso && (
        <div
          data-abierto={visible}
          className="emergente pointer-events-auto flex max-w-lg items-center gap-3 rounded-ficha border border-borde bg-superficie px-4 py-3 text-[15px] text-tinta shadow-flotante"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lavanda text-acento"
          >
            i
          </span>
          <span>{TEXTO_DE_AVISO[aviso]}</span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="ml-1 rounded-control px-2 py-1 text-[14px] font-semibold text-acento hover:bg-realce"
          >
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}
