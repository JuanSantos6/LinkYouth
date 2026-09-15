import { Avatar } from "@/components/ui/Avatar";
import { BotonAccion } from "@/components/ui/BotonAccion";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Insignia } from "@/components/ui/Insignia";
import { postularse } from "@/lib/acciones/postulaciones";
import type { EntradaDelFeed } from "@/lib/dominio/FeedDeVacantes";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";

/**
 * Una vacante del listado.
 *
 * No es una tarjeta: las vacantes son un registro y se leen en fila, separadas
 * por filetes. La que encabeza por compatibilidad sí se despega del plano
 * —canto ámbar y elevación real— porque es la única que merece esa jerarquía.
 *
 * El porcentaje se trata como elemento gráfico, no como texto suelto, y nunca
 * va solo: al lado están las etiquetas que lo explican. Un número que no se
 * puede verificar no es un dato, es una promesa.
 *
 * En pantalla angosta la cifra encabeza la fila en lugar de esconderse. Es el
 * dato que ordena el listado: si desaparece en el teléfono, la persona no
 * entiende por qué está viendo esa vacante primero.
 */
export function FilaVacante({
  entrada,
  yaPostulado = false,
  esEjemplo = false,
}: {
  entrada: EntradaDelFeed;
  yaPostulado?: boolean;
  /** La vacante salió de `ejemplos.ts`: no existe nada a lo que postularse. */
  esEjemplo?: boolean;
}) {
  const { vacante, compatibilidad, destacada } = entrada;

  const contenedor = destacada
    ? "rounded-ficha border border-borde border-l-[3px] border-l-senal bg-superficie p-4 shadow-elevada sm:p-5"
    : "px-1 py-5";

  return (
    <article className={contenedor}>
      {destacada && (
        <p className="mb-3 text-[13px] font-medium text-tinta">
          La más compatible con lo que ya acreditaste
        </p>
      )}

      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {compatibilidad.medible && (
          <p className="flex w-full items-baseline gap-2 sm:order-3 sm:w-20 sm:flex-col sm:items-end sm:gap-0">
            <span className="cifra text-[28px] text-tinta sm:text-[34px]">
              {compatibilidad.porcentaje}
              <span className="text-[16px] text-apagado sm:text-[18px]">%</span>
            </span>
            <span className="text-[12px] text-apagado sm:mt-0.5">
              compatible
            </span>
          </p>
        )}

        <Avatar
          nombre={vacante.empresa.razon_social}
          url={vacante.empresa.logo_url}
          forma="cuadrado"
        />

        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-apagado">
            <span className="font-medium text-tinta">
              {vacante.empresa.razon_social}
            </span>
            <span>{vacante.empresa.rubro}</span>
            <span>{tiempoRelativo(vacante.creada_en)}</span>
          </div>

          <h3 className="mt-1 text-[18px] text-tinta sm:text-[19px]">
            {vacante.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-apagado">
            {vacante.descripcion}
          </p>
        </div>
      </div>

      {(vacante.habilidades.length > 0 || vacante.tags.length > 0) && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {[...vacante.habilidades, ...vacante.tags].map((requisito) => (
            <li key={requisito}>
              <Etiqueta coincide={compatibilidad.cubre(requisito)}>
                {requisito}
              </Etiqueta>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-apagado">
          <Insignia tono={vacante.tipo === "pasantia" ? "acento" : "neutro"}>
            {etiquetaTipo(vacante.tipo)}
          </Insignia>
          <span>
            {vacante.posiciones === 1
              ? "1 posición"
              : `${vacante.posiciones} posiciones`}
          </span>
        </div>

        <BotonAccion
          accion={postularse}
          campo="vacanteId"
          valor={vacante.id}
          hecho={yaPostulado}
          esEjemplo={esEjemplo}
          textos={{
            inicial: "Postularme",
            enCurso: "Enviando…",
            hecho: "Ya te postulaste",
            ejemplo: "Disponible con vacantes reales",
          }}
        />
      </div>
    </article>
  );
}
