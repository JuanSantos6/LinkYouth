import { FormularioDeResultadoDeTest } from "@/components/interview-lab/FormularioDeResultadoDeTest";
import { InterruptorDeVisibilidad } from "@/components/interview-lab/InterruptorDeVisibilidad";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import { DetallesSuaves } from "@/components/ui/DetallesSuaves";
import {
  borrarResultadoDeTest,
  cambiarVisibilidadDeResultado,
} from "@/lib/acciones/interviewLab";
import type { ResultadoDeTest } from "@/lib/data/tipos";
import type { ClaveDeTestOpcional } from "@/lib/dominio/InterviewLab";

/**
 * Lo que cargó el joven de un test de JobCannon y cómo cambiarlo (migración
 * 010). Pendiente: el formulario plegado, porque el test es opcional.
 * Completado: lo que cargó, el interruptor y las opciones de cambiarlo o
 * borrarlo.
 */
export function CargaDeResultadoDeTest({
  test,
  resultado,
  esEjemplo = false,
}: {
  test: ClaveDeTestOpcional;
  resultado: ResultadoDeTest | null;
  esEjemplo?: boolean;
}) {
  if (!resultado) {
    return (
      <DetallesSuaves
        className="border-t border-filete"
        resumen={<span className="text-[16px]">Cargar mi resultado</span>}
      >
        <div className="pb-2">
          <FormularioDeResultadoDeTest
            test={test}
            guardado={null}
            esEjemplo={esEjemplo}
          />
        </div>
      </DetallesSuaves>
    );
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-x-6 gap-y-2 rounded-ficha bg-realce px-4 py-3 sm:grid-cols-[auto_1fr]">
        <dt className="text-[13.5px] text-apagado">Nivel o puntaje</dt>
        <dd className="text-[15px] font-semibold text-tinta">
          {resultado.puntaje ?? "Sin cargar"}
        </dd>
        <dt className="text-[13.5px] text-apagado">Resultado principal</dt>
        <dd className="text-[15px] text-tinta">
          {resultado.resultado ?? "Sin cargar"}
        </dd>
      </dl>

      <InterruptorDeVisibilidad
        visible={resultado.visible_para_empresas}
        accion={cambiarVisibilidadDeResultado}
        campos={{ test }}
        esEjemplo={esEjemplo}
      />

      <DetallesSuaves
        className="border-t border-filete"
        resumen={<span className="text-[16px]">Cambiar resultado</span>}
      >
        <div className="space-y-5 pb-2">
          <FormularioDeResultadoDeTest
            test={test}
            guardado={resultado}
            esEjemplo={esEjemplo}
          />
          <div className="border-t border-filete pt-4">
            <BotonConfirmado
              accion={borrarResultadoDeTest}
              campos={{ test }}
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
