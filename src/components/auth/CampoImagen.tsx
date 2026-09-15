"use client";

import { useState } from "react";

import { Campo } from "@/components/ui/Campo";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/**
 * Elección de la foto de perfil o el logo, con vista previa.
 *
 * La vista previa se arma con `URL.createObjectURL` y no se sube nada hasta
 * mandar el formulario: es el navegador mostrando un archivo que ya tiene, no
 * un viaje al servidor.
 *
 * El campo es opcional en los dos registros. Si la imagen no se puede subir
 * —el bucket todavía no existe, la conexión se cortó— la cuenta se crea igual
 * y la foto se puede cargar después desde el perfil: perder el alta entera por
 * una foto sería un mal negocio para quien se está registrando.
 */
export function CampoImagen({
  nombre,
  etiqueta,
  ayuda,
}: {
  /** Nombre del campo en el `FormData`: `avatar` o `logo`. */
  nombre: string;
  etiqueta: string;
  ayuda: string;
}) {
  const [vista, setVista] = useState<string | null>(null);
  const [problema, setProblema] = useState("");

  function elegir(archivo: File | undefined) {
    setVista((anterior) => {
      // Cada objeto creado retiene el archivo en memoria hasta que se lo
      // revoca. Sin esto, probar cinco fotos deja cuatro colgadas.
      if (anterior) URL.revokeObjectURL(anterior);
      return archivo ? URL.createObjectURL(archivo) : null;
    });

    setProblema(
      archivo ? (ReglasDeRegistro.problemaDeImagen(archivo) ?? "") : "",
    );
  }

  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <div className="mt-1.5 flex items-center gap-3">
        {vista && (
          // Es un blob local del navegador: el optimizador de Next no lo puede
          // tocar y no hay nada que optimizar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vista}
            alt=""
            className="h-14 w-14 shrink-0 rounded-ficha border border-borde object-cover"
          />
        )}

        <input
          type="file"
          name={nombre}
          accept={ReglasDeRegistro.FORMATOS_IMAGEN.join(",")}
          onChange={(evento) => elegir(evento.target.files?.[0])}
          className="min-w-0 flex-1 text-[14px] text-apagado file:mr-3 file:rounded-control file:border file:border-borde-control file:bg-superficie file:px-3 file:py-1.5 file:text-[14px] file:font-medium file:text-tinta hover:file:bg-realce"
        />
      </div>

      <p aria-live="polite" className="mt-1 text-[13px] text-tinta">
        {problema}
      </p>
    </Campo>
  );
}
