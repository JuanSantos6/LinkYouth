import type { ReseniaRecibida } from "@/lib/data/tipos";

/** Cuántas reseñas recibió una empresa y su promedio (RF7.4). */
export class ResumenDeResenias {
  constructor(private readonly resenias: ReseniaRecibida[]) {}

  get total(): number {
    return this.resenias.length;
  }

  get promedio(): number {
    if (this.total === 0) return 0;
    return this.resenias.reduce((s, r) => s + r.calificacion, 0) / this.total;
  }

  /** «4,3»: un decimal, con coma. */
  get promedioTexto(): string {
    return new Intl.NumberFormat("es-UY", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(this.promedio);
  }
}
