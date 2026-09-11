"use client";

import { useRef, useState } from "react";

import { IconoCamara } from "@/components/layout/Iconos";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Avatar con acción de cambiar foto (RF1.5.6).
 *
 * Muestra la vista previa apenas se elige el archivo. La subida a Supabase
 * Storage queda pendiente del módulo de almacenamiento; hasta entonces el
 * componente avisa qué falta en lugar de simular que guardó.
 */
export function AvatarEditable({
  nombre,
  url,
}: {
  nombre: string;
  url: string | null;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(url);
  const [aviso, setAviso] = useState("");

  function alElegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setVistaPrevia(URL.createObjectURL(archivo));
    setAviso(
      "Vista previa lista. La subida se habilita cuando esté configurado Supabase Storage.",
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar nombre={nombre} url={vistaPrevia} tamano="lg" />

        <button
          type="button"
          onClick={() => campo.current?.click()}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-borde bg-superficie text-apagado transition-colors duration-150 hover:border-acento hover:text-acento"
        >
          <IconoCamara className="h-4 w-4" />
          <span className="sr-only">Cambiar foto de perfil</span>
        </button>

        <input
          ref={campo}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={alElegirArchivo}
          className="hidden"
        />
      </div>

      <div>
        <p className="text-[14px] font-medium text-tinta">Foto de perfil</p>
        <p className="mt-0.5 text-[13px] text-apagado">
          JPG, PNG o WebP. Una foto donde se te vea la cara ayuda a que te
          reconozcan en una entrevista.
        </p>
        {aviso && (
          <p
            aria-live="polite"
            className="mt-1.5 border-l-2 border-tinta pl-2 text-[13px] text-tinta"
          >
            {aviso}
          </p>
        )}
      </div>
    </div>
  );
}
