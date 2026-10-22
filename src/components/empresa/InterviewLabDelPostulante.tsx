import { InsigniaDePersonalidad } from "@/components/perfil/InsigniaDePersonalidad";
import type { InterviewLabCompartido } from "@/lib/data/tipos";
import {
  CLAVES_OPCIONALES,
  etiquetaDeOrigen,
  testDe,
} from "@/lib/dominio/InterviewLab";
import { TipoDePersonalidad } from "@/lib/dominio/TipoDePersonalidad";
import { fechaConAnio } from "@/lib/formato";

/**
 * Lo que la persona compartió de su Interview Lab, en la ficha del
 * postulante (migraciones 009 y 010). Sin nada compartido no se muestra.
 *
 * Cada resultado lleva quién lo afirma («Declarado por el postulante»): hoy
 * los carga siempre el joven. Es para leer y nada más: no entra en la
 * compatibilidad ni en el orden de los candidatos.
 */
export function InterviewLabDelPostulante({
  compartido,
}: {
  compartido: InterviewLabCompartido;
}) {
  const tipo = TipoDePersonalidad.de(compartido.personalidad);
  const tests = CLAVES_OPCIONALES.flatMap((clave) => {
    const fila = compartido.tests.find((t) => t.test === clave);
    return fila ? [{ ...fila, nombre: testDe(clave).nombre }] : [];
  });

  if (!tipo && tests.length === 0) return null;

  return (
    <section
      aria-labelledby="t-interview-lab"
      className="space-y-4 rounded-tarjeta border border-borde bg-superficie p-5"
    >
      <h2 id="t-interview-lab" className="text-[19px] font-bold text-tinta">
        Interview Lab
      </h2>

      {tipo && (
        <div className="space-y-1.5">
          <h3 className="text-[14px] font-semibold text-apagado">
            Personalidad
          </h3>
          <InsigniaDePersonalidad
            tipo={tipo}
            tamano="compacta"
            etiqueta="Declarado por el postulante"
          />
        </div>
      )}

      {tests.length > 0 && (
        <ul className="space-y-2.5">
          {tests.map((t) => (
            <li
              key={t.test}
              data-test={t.test}
              className="space-y-1 rounded-ficha border border-filete p-3"
            >
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[15px] font-semibold text-tinta">
                  {t.nombre}
                </span>
                {t.puntaje && (
                  <span className="text-[14px] font-semibold text-acento">
                    {t.puntaje}
                  </span>
                )}
              </p>
              {t.resultado && (
                <p className="text-[14px] text-tinta">{t.resultado}</p>
              )}
              <p className="text-[13px] text-apagado">
                {etiquetaDeOrigen(t.origen)} · {fechaConAnio(t.cargado_en)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[13px] text-apagado">
        Los cargó la persona a partir de tests externos (16Personalities,
        JobCannon). LinkYouth no los valida y no los usa en la compatibilidad.
      </p>
    </section>
  );
}
