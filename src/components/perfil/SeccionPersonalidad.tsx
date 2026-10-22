import { FormularioDePersonalidad } from "@/components/perfil/FormularioDePersonalidad";
import { InsigniaDePersonalidad } from "@/components/perfil/InsigniaDePersonalidad";
import { InterruptorDeVisibilidad } from "@/components/perfil/InterruptorDeVisibilidad";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import { BotonEnlace } from "@/components/ui/Boton";
import { DetallesSuaves } from "@/components/ui/DetallesSuaves";
import { Insignia } from "@/components/ui/Insignia";
import { borrarPersonalidad } from "@/lib/acciones/personalidad";
import type { PersonalidadDeclarada } from "@/lib/data/tipos";
import { TipoDePersonalidad } from "@/lib/dominio/TipoDePersonalidad";
import { fechaConAnio } from "@/lib/formato";

const TEST = "https://www.16personalities.com/es";

/**
 * «Personalidad (opcional)» en el perfil del joven (migración 009).
 *
 * 16Personalities no tiene API: el botón abre su test en otra pestaña y el
 * joven vuelve a cargar acá lo que le dio. Con resultado: la insignia, el
 * interruptor para mostrarlo y las opciones de cambiarlo o borrarlo. Sin
 * resultado: el formulario directamente.
 */
export function SeccionPersonalidad({
  personalidad,
  esEjemplo = false,
}: {
  personalidad: PersonalidadDeclarada | null;
  esEjemplo?: boolean;
}) {
  const tipo = TipoDePersonalidad.de(personalidad?.tipo);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[52ch] text-[14.5px] text-tinta">
          Si hiciste el test de 16Personalities, podés sumar tu resultado. Si
          no, hacelo gratis en su sitio y volvé con el tipo que te dio.
        </p>
        <BotonEnlace href={TEST} target="_blank" rel="noopener noreferrer">
          Hacer el test
          <span aria-hidden="true">↗</span>
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </BotonEnlace>
      </div>

      <p className="rounded-ficha bg-realce px-4 py-3 text-[13.5px] text-tinta">
        Es un resultado que cargás vos. LinkYouth no lo valida y no lo usa para
        calcular tu compatibilidad.
      </p>

      {tipo && personalidad ? (
        <>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <InsigniaDePersonalidad tipo={tipo} />
            <div className="space-y-1.5 text-center sm:text-left">
              <Insignia tono="acreditado">Completado</Insignia>
              <p className="text-[14px] text-apagado">
                Lo cargaste el {fechaConAnio(personalidad.cargada_en)}. Grupo{" "}
                {tipo.nombreDelGrupo}, variante{" "}
                {tipo.nombreDeLaVariante.toLowerCase()}.
              </p>
            </div>
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
                      "Tu perfil vuelve a «Sin completar» y ninguna empresa lo ve más. Podés cargarlo de nuevo cuando quieras.",
                    confirmar: "Sí, borrarlo",
                    enCurso: "Borrando…",
                  }}
                />
              </div>
            </div>
          </DetallesSuaves>
        </>
      ) : (
        <>
          <Insignia tono="apagado">Sin completar</Insignia>
          <FormularioDePersonalidad guardado={null} esEjemplo={esEjemplo} />
        </>
      )}
    </div>
  );
}
