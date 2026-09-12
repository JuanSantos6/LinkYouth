"use client";

import { useRef, useState } from "react";

import { IconoCamara } from "@/components/layout/Iconos";
import { Avatar } from "@/components/ui/Avatar";
import { Aviso } from "@/components/ui/AvisoOrigen";

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
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-borde bg-superficie text-tinta-media shadow-elevada transition-colors hover:border-primario hover:text-primario"
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

      <div className="text-sm">
        <p className="font-semibold text-tinta">Foto de perfil</p>
        <p className="mt-0.5 text-xs text-tinta-suave">
          JPG, PNG o WebP. Una foto donde se te vea la cara ayuda a que te
          reconozcan en una entrevista.
        </p>
        {/* La región vive siempre en el DOM: un `aria-live` que aparece
            junto con su texto no siempre se anuncia. */}
        <div aria-live="polite" className="mt-2 empty:mt-0">
          {aviso && <Aviso>{aviso}</Aviso>}
        </div>
      </div>
    </div>
  );
}
