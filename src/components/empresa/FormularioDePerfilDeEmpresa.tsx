"use client";

import { useActionState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Aviso } from "@/components/ui/AvisoOrigen";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { actualizarPerfilDeEmpresa } from "@/lib/acciones/perfilDeEmpresa";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import type { PerfilDeEmpresa } from "@/lib/data/tipos";
import { ReglasDePerfilDeEmpresa } from "@/lib/dominio/ReglasDePerfilDeEmpresa";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/**
 * El perfil de la empresa (RF1.2, RF7.1): razón social, RUT, rubro,
 * descripción, sitio web y logo. Es lo que ve un joven antes de postularse.
 *
 * El RUT no se puede repetir: la acción lo comprueba para dar el error sobre
 * el campo, y el índice único de la base es la defensa final.
 */
export function FormularioDePerfilDeEmpresa({
  empresa,
  esEjemplo = false,
}: {
  empresa: PerfilDeEmpresa;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    actualizarPerfilDeEmpresa,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const R = ReglasDePerfilDeEmpresa;

  return (
    <form action={enviar} className="space-y-6">
      <EnfocarPrimerError estado={estado} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar
          nombre={empresa.razon_social}
          url={empresa.logo_url}
          semilla={empresa.id}
          tamano="lg"
          forma="cuadrado"
        />
        <div className="flex-1">
          <Campo
            etiqueta={empresa.logo_url ? "Cambiar el logo" : "Logo"}
            ayuda="JPG, PNG o WebP de hasta 5 MB. Mejor cuadrado."
            error={error.logo}
          >
            <input
              name="logo"
              type="file"
              accept={ReglasDeRegistro.FORMATOS_IMAGEN.join(",")}
              aria-invalid={error.logo ? true : undefined}
              className={`mt-1.5 ${CAMPO} file:mr-3 file:rounded-control file:border-0 file:bg-realce file:px-3 file:py-1 file:text-[14px] file:text-tinta`}
            />
          </Campo>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Razón social" error={error.razonSocial}>
          <input
            name="razonSocial"
            defaultValue={valor.texto("razonSocial", empresa.razon_social)}
            required
            minLength={2}
            maxLength={ReglasDeRegistro.LARGO_NOMBRE}
            autoComplete="organization"
            aria-invalid={error.razonSocial ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="RUT"
          ayuda="Doce dígitos. Puede ir con puntos o guiones."
          error={error.rut}
        >
          <input
            name="rut"
            defaultValue={valor.texto("rut", empresa.rut ?? "")}
            required
            inputMode="numeric"
            aria-invalid={error.rut ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Rubro"
          ayuda="«Desarrollo de software», «Logística»."
          error={error.rubro}
        >
          <input
            name="rubro"
            defaultValue={valor.texto("rubro", empresa.rubro ?? "")}
            required
            minLength={2}
            maxLength={R.RUBRO_MAX}
            aria-invalid={error.rubro ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="Sitio web (opcional)"
          ayuda="Con o sin «https://»: nubeuy.com sirve."
          error={error.sitioWeb}
        >
          <input
            name="sitioWeb"
            type="text"
            inputMode="url"
            autoComplete="url"
            defaultValue={valor.texto("sitioWeb", empresa.sitio_web ?? "")}
            maxLength={R.SITIO_MAX}
            aria-invalid={error.sitioWeb ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Descripción (opcional)"
        ayuda={`Qué hace la empresa y cómo es trabajar ahí. Hasta ${R.DESCRIPCION_MAX} caracteres.`}
        error={error.descripcion}
      >
        <textarea
          name="descripcion"
          defaultValue={valor.texto("descripcion", empresa.descripcion ?? "")}
          rows={5}
          maxLength={R.DESCRIPCION_MAX}
          aria-invalid={error.descripcion ? true : undefined}
          className={`mt-1.5 resize-y ${CAMPO}`}
        />
      </Campo>

      {esEjemplo && (
        <Aviso titulo="Modo demostración">
          Con datos de ejemplo no hay base donde guardar el perfil. El botón
          queda desactivado.
        </Aviso>
      )}

      <div className="flex flex-col items-start gap-2 border-t border-filete pt-5 sm:items-end">
        <Boton type="submit" disabled={esEjemplo || enCurso}>
          {enCurso ? "Guardando…" : "Guardar perfil"}
        </Boton>
        <MensajeDeAccion estado={estado} className="max-w-sm sm:text-right" />
      </div>
    </form>
  );
}
