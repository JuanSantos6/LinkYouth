import { FormularioDePersonalidad } from "@/components/interview-lab/FormularioDePersonalidad";
import { InterruptorDeVisibilidad } from "@/components/interview-lab/InterruptorDeVisibilidad";
import { InsigniaDePersonalidad } from "@/components/perfil/InsigniaDePersonalidad";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import { DetallesSuaves } from "@/components/ui/DetallesSuaves";
import { borrarPersonalidad } from "@/lib/acciones/personalidad";
import type { PersonalidadDeclarada } from "@/lib/data/tipos";
import { TipoDePersonalidad } from "@/lib/dominio/TipoDePersonalidad";

/**
 * Cargar, cambiar, mostrar u ocultar y borrar el resultado de
 * 16Personalities (migración 009). Desde el Interview Lab (migración 010)
 * es el único lugar donde se edita; el perfil lo muestra de solo lectura.
 *
 * Con resultado: la insignia, el interruptor y las opciones de cambiarlo o
 * borrarlo. Sin resultado: el formulario directamente, porque es el test
 * obligatorio.
 */
export function CargaDePersonalidad({
  personalidad,
  esEjemplo = false,
}: {
  personalidad: PersonalidadDeclarada | null;
  esEjemplo?: boolean;
}) {
  const tipo = TipoDePersonalidad.de(personalidad?.tipo);

  if (!tipo || !personalidad) {
    return <FormularioDePersonalidad guardado={null} esEjemplo={esEjemplo} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <InsigniaDePersonalidad tipo={tipo} />
        <p className="text-center text-[14px] text-apagado sm:text-left">
          Grupo {tipo.nombreDelGrupo}, variante{" "}
          {tipo.nombreDeLaVariante.toLowerCase()}.
        </p>
      </div>

      <InterruptorDeVisibilidad
        visible={personalidad.visible_para_empresas}
        esEjemplo={esEjemplo}
      />

      <DetallesSuaves
        className="border-t border-filete"
        resumen={<span className="text-[16px]">Cambiar resultado</span>}
      >
        <div className="space-y-5 pb-2">
          <FormularioDePersonalidad
            guardado={personalidad.tipo}
            visibleActual={personalidad.visible_para_empresas}
            esEjemplo={esEjemplo}
          />
          <div className="border-t border-filete pt-4">
            <BotonConfirmado
              accion={borrarPersonalidad}
              campos={{}}
              variante="fantasma"
              deshabilitado={esEjemplo}
              textos={{
                inicial: "Borrar resultado",
                pregunta:
                  "Vuelve a «Pendiente» y ninguna empresa lo ve más. Podés cargarlo de nuevo cuando quieras.",
                confirmar: "Sí, borrarlo",
                enCurso: "Borrando…",
              }}
            />
          </div>
        </div>
      </DetallesSuaves>
    </div>
  );
}
