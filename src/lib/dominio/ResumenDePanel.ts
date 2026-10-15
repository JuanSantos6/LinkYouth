import type {
  BusquedaResumen,
  EventoDeEmpresa,
  PanelDeEmpresa,
  Recomendado,
} from "@/lib/data/tipos";
import { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";

/** Cuántos recomendados entran en el panel: los demás, en cada búsqueda. */
const RECOMENDADOS_EN_PANEL = 4;

/**
 * Los números y listas del panel de empresa. Qué cuenta como «activa»,
 * «nueva», «próximo» o «recomendado» es una regla de negocio: vive acá y no
 * en la pantalla.
 */
export class ResumenDePanel {
  constructor(
    private readonly panel: PanelDeEmpresa,
    private readonly ahora: Date = new Date(),
  ) {}

  get busquedasActivas(): BusquedaResumen[] {
    return this.panel.busquedas.filter((b) => b.estado === "activa");
  }

  /** Postulaciones que nadie de la empresa miró todavía. */
  get postulantesNuevos(): number {
    return this.panel.busquedas.reduce((suma, b) => suma + b.nuevas, 0);
  }

  get posicionesAbiertas(): number {
    return this.busquedasActivas.reduce((suma, b) => suma + b.posiciones, 0);
  }

  get eventosProximos(): EventoDeEmpresa[] {
    return this.panel.eventos
      .filter(
        (evento) =>
          evento.estado === "activo" &&
          new Date(evento.fecha_hora) >= this.ahora,
      )
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  }

  /**
   * Postulantes propios que todavía están en proceso, de más a menos
   * coincidencia con la búsqueda a la que se postularon.
   *
   * Solo entre quienes se postularon a la empresa: recomendar a personas que
   * no lo hicieron obligaría a abrirle a cada empresa los datos de todos los
   * jóvenes, que es justo lo que cerró el arreglo H1.
   */
  get recomendados(): (Recomendado & {
    coincidencia: CoincidenciaDeCandidato;
  })[] {
    return this.panel.recomendados
      .filter(
        ({ postulacion }) =>
          postulacion.persona !== null &&
          ["pendiente", "en_revision", "entrevista"].includes(
            postulacion.estado,
          ),
      )
      .map((recomendado) => ({
        ...recomendado,
        coincidencia: CoincidenciaDeCandidato.entre(
          {
            habilidades: recomendado.busqueda.habilidades.map((h) => h.nombre),
            tagsOcultos: recomendado.busqueda.tagsOcultos.map((t) => t.nombre),
          },
          recomendado.postulacion,
        ),
      }))
      .filter(({ coincidencia }) => coincidencia.habilidadesCubiertas > 0)
      .sort((a, b) =>
        CoincidenciaDeCandidato.comparar(
          { coincidencia: a.coincidencia, fecha: a.postulacion.creada_en },
          { coincidencia: b.coincidencia, fecha: b.postulacion.creada_en },
        ),
      )
      .slice(0, RECOMENDADOS_EN_PANEL);
  }
}
