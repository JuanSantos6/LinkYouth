import type {
  BusquedaResumen,
  EventoDeEmpresa,
  PanelDeEmpresa,
  Recomendado,
} from "@/lib/data/tipos";
import { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";

/** Cuántos recomendados entran en el panel: los demás, en cada búsqueda. */
const RECOMENDADOS_EN_PANEL = 4;

/** Cuántos postulantes nuevos lista el panel antes de «Ver todos». */
const NUEVOS_EN_PANEL = 5;

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

  /**
   * Lo que le falta al perfil de la empresa para que un joven sepa quién
   * publica: logo, descripción y sitio web. Vacío si está completo.
   */
  get faltaEnElPerfil(): string[] {
    const { empresa } = this.panel;
    return [
      !empresa.logo_url && "el logo",
      !empresa.descripcion?.trim() && "una descripción",
      !empresa.sitio_web && "el sitio web",
    ].filter((falta): falta is string => Boolean(falta));
  }

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
   * Las postulaciones `pendiente` de las búsquedas activas, de la más reciente
   * a la más vieja: lo primero que el panel pide revisar. Quienes ya no
   * comparten sus datos (`persona` nula) no se listan.
   */
  nuevosParaRevisar(limite = NUEVOS_EN_PANEL): Recomendado[] {
    return this.panel.recomendados
      .filter(
        ({ postulacion }) =>
          postulacion.persona !== null && postulacion.estado === "pendiente",
      )
      .sort((a, b) =>
        b.postulacion.creada_en.localeCompare(a.postulacion.creada_en),
      )
      .slice(0, limite);
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
          CoincidenciaDeCandidato.requisitosDe(recomendado.busqueda),
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
