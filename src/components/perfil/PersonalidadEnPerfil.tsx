import { InsigniaDePersonalidad } from "@/components/perfil/InsigniaDePersonalidad";
import { BotonEnlace } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
import type { PersonalidadDeclarada } from "@/lib/data/tipos";
import { TipoDePersonalidad } from "@/lib/dominio/TipoDePersonalidad";
import { fechaConAnio } from "@/lib/formato";

const EN_EL_LAB = "/interview-lab#test-personalidad";

/**
 * La personalidad en el perfil, de solo lectura (migración 010): se carga,
 * se edita, se muestra u oculta y se borra solo en el Interview Lab.
 */
export function PersonalidadEnPerfil({
  personalidad,
}: {
  personalidad: PersonalidadDeclarada | null;
}) {
  const tipo = TipoDePersonalidad.de(personalidad?.tipo);

  if (!tipo || !personalidad) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Insignia tono="apagado">Sin completar</Insignia>
          <p className="text-[14px] text-apagado">
            Es el test obligatorio del Interview Lab. Lleva unos 10 minutos.
          </p>
        </div>
        <BotonEnlace href={EN_EL_LAB}>Completar en Interview Lab</BotonEnlace>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <InsigniaDePersonalidad tipo={tipo} />
      <div className="space-y-2 text-center sm:text-left">
        <Insignia tono="acreditado">Completado</Insignia>
        <p className="text-[14px] text-apagado">
          Lo cargaste el {fechaConAnio(personalidad.cargada_en)}.{" "}
          {personalidad.visible_para_empresas
            ? "Lo ven las empresas de las búsquedas a las que te postulaste."
            : "Ninguna empresa lo ve."}
        </p>
        <BotonEnlace href={EN_EL_LAB}>Editar en Interview Lab</BotonEnlace>
      </div>
    </div>
  );
}
