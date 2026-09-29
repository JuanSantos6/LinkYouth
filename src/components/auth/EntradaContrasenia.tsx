"use client";

import { useId, useState, type ComponentPropsWithoutRef } from "react";

import { CAMPO } from "@/components/ui/Campo";

/**
 * Campo de contraseña con un botón para mostrarla u ocultarla.
 *
 * El botón dice qué va a hacer («Mostrar contraseña» / «Ocultar contraseña»),
 * lleva `aria-pressed` y `aria-controls`, y no le roba el envío al formulario
 * (`type="button"`). El resto de las props van directo al `<input>`.
 */
export function EntradaContrasenia({
  className = "",
  ...props
}: Omit<ComponentPropsWithoutRef<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const idGenerado = useId();
  const id = props.id ?? idGenerado;

  return (
    <span className="relative mt-1.5 block">
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        className={`${CAMPO} pr-12 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((valor) => !valor)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control text-apagado transition-colors duration-150 hover:bg-realce hover:text-tinta"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}
