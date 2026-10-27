"use client";

import { useActionState, useRef, useState } from "react";

import { IconoCamara } from "@/components/layout/Iconos";
import { Avatar } from "@/components/ui/Avatar";
import { Aviso } from "@/components/ui/AvisoOrigen";
import { cambiarFotoDePerfil } from "@/lib/acciones/perfil";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/**
 * Avatar con acción de cambiar foto (RF1.5.6).
 *
 * Muestra la vista previa apenas se elige el archivo y lo sube en el acto. Si
 * la imagen no cumple (formato, peso) lo dice sin salir al servidor; si la
 * subida falla, vuelve a la foto anterior en vez de dejar una vista previa
 * que no se guardó.
 */
export function AvatarEditable({
  nombre,
  url,
  semilla,
}: {
  nombre: string;
  url: string | null;
  semilla?: string;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(url);
  const [rechazo, setRechazo] = useState("");
  const [estado, enviar, enCurso] = useActionState(
    async (previo: typeof ACCION_INICIAL, datos: FormData) => {
      const resultado = await cambiarFotoDePerfil(previo, datos);
      if (resultado.estado === "error") setVistaPrevia(url);
      return resultado;
    },
    ACCION_INICIAL,
  );

  function alElegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const problema = ReglasDeRegistro.problemaDeImagen(archivo);
    if (problema) {
      setRechazo(problema);
      evento.target.value = "";
      return;
    }

    setRechazo("");
    setVistaPrevia(URL.createObjectURL(archivo));
    formulario.current?.requestSubmit();
  }

  const mensaje = rechazo || (enCurso ? "Subiendo la foto…" : estado.mensaje);
  const esError = Boolean(rechazo) || (!enCurso && estado.estado === "error");

  return (
    <form ref={formulario} action={enviar} className="flex items-center gap-4">
      <div className="relative">
        <Avatar
          nombre={nombre}
          url={vistaPrevia}
          semilla={semilla}
          tamano="lg"
        />

        <button
          type="button"
          onClick={() => campo.current?.click()}
          disabled={enCurso}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-borde bg-superficie text-apagado shadow-elevada transition-colors hover:border-acento hover:text-acento disabled:opacity-60"
        >
          <IconoCamara className="h-4 w-4" />
          <span className="sr-only">Cambiar foto de perfil</span>
        </button>

        <input
          ref={campo}
          name="foto"
          type="file"
          accept={ReglasDeRegistro.FORMATOS_IMAGEN.join(",")}
          onChange={alElegirArchivo}
          className="hidden"
          data-testid="foto-de-perfil"
        />
      </div>

      <div className="text-[14px]">
        <p className="font-semibold text-tinta">Foto de perfil</p>
        <p className="mt-0.5 text-[13px] text-apagado">
          JPG, PNG o WebP de hasta 5 MB. Una foto donde se te vea la cara ayuda
          a que te reconozcan en una entrevista.
        </p>
        {/* La región vive siempre en el DOM: un `aria-live` que aparece
            junto con su texto no siempre se anuncia. */}
        <div aria-live="polite" className="mt-2 empty:mt-0">
          {mensaje &&
            (esError ? (
              <Aviso titulo="No se pudo">{mensaje}</Aviso>
            ) : (
              <Aviso>{mensaje}</Aviso>
            ))}
        </div>
      </div>
    </form>
  );
}
