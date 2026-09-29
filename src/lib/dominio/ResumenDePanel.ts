import type { PanelDeEmpresa } from "@/lib/data/tipos";

/**
 * Los números de arriba del panel de empresa. Qué cuenta como «activa» o
 * «próximo» es una regla de negocio: vive acá y no en la pantalla.
 */
export class ResumenDePanel {
  constructor(
    private readonly panel: PanelDeEmpresa,
    private readonly ahora: Date = new Date(),
  ) {}

  get busquedasActivas(): PanelDeEmpresa["vacantes"] {
    return this.panel.vacantes.filter((vacante) => vacante.estado === "activa");
  }

  get posicionesAbiertas(): number {
    return this.busquedasActivas.reduce(
      (suma, vacante) => suma + vacante.posiciones,
      0,
    );
  }

  get postulacionesRecibidas(): number {
    return this.panel.vacantes.reduce(
      (suma, vacante) => suma + vacante.postulaciones,
      0,
    );
  }

  get eventosProximos(): PanelDeEmpresa["eventos"] {
    return this.panel.eventos.filter(
      (evento) =>
        evento.estado === "activo" && new Date(evento.fecha_hora) >= this.ahora,
    );
  }
}
