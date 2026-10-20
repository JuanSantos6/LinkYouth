"use client";

import { useEffect, useRef } from "react";

import type { EstadoFormulario } from "@/lib/acciones/tipos";

/**
 * Cuando la acción de un formulario devuelve errores por campo, lleva el foco
 * al primer elemento marcado con `aria-invalid="true"` dentro del `<form>`.
 */
export function EnfocarPrimerError({ estado }: { estado: EstadoFormulario }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!estado.campos || Object.keys(estado.campos).length === 0) return;

    const formulario = ref.current?.closest("form");
    const primero = formulario?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    if (!primero) return;

    if (primero.tabIndex < 0 && !primero.hasAttribute("tabindex")) {
      primero.setAttribute("tabindex", "-1");
    }
    primero.focus();
  }, [estado]);

  return <span ref={ref} hidden />;
}
