import type {
  DatosDeCandidato,
  EstadoPostulacion,
  PostulacionRecibida,
} from "@/lib/data/tipos";

/** Una persona que se postuló a la empresa, con todas sus postulaciones. */
export type Candidato = {
  persona: DatosDeCandidato;
  habilidades: string[];
  tags: string[];
  postulaciones: {
    id: string;
    estado: EstadoPostulacion;
    creada_en: string;
    busqueda: { id: string; titulo: string };
  }[];
};

/**
 * Búsqueda de candidatos por intereses (RF7.3), entre los postulantes
 * propios: quienes se postularon a alguna búsqueda de la empresa y no se
 * retiraron. Buscar entre todos los jóvenes obligaría a abrirles a todas las
 * empresas los datos de todos (ver `obtenerPostulantesPropios`).
 */
export class BuscadorDeCandidatos {
  /** Junta las postulaciones de una misma persona en un solo candidato. */
  static agrupar(
    filas: {
      postulacion: PostulacionRecibida;
      busqueda: { id: string; titulo: string };
    }[],
  ): Candidato[] {
    const porPersona = new Map<string, Candidato>();

    for (const { postulacion, busqueda } of filas) {
      const { persona } = postulacion;
      if (!persona) continue;

      const candidato = porPersona.get(persona.id) ?? {
        persona,
        habilidades: postulacion.habilidades,
        tags: postulacion.tags,
        postulaciones: [],
      };
      candidato.postulaciones.push({
        id: postulacion.id,
        estado: postulacion.estado,
        creada_en: postulacion.creada_en,
        busqueda,
      });
      porPersona.set(persona.id, candidato);
    }

    // Quien se postuló más recientemente, primero.
    const ultima = (c: Candidato) =>
      c.postulaciones.reduce(
        (max, p) => (p.creada_en > max ? p.creada_en : max),
        "",
      );
    return [...porPersona.values()].sort((a, b) =>
      ultima(b).localeCompare(ultima(a)),
    );
  }

  /** Los intereses presentes entre los candidatos, con cuántos los tienen. */
  static intereses(
    candidatos: Candidato[],
  ): { nombre: string; cuantos: number }[] {
    const cuenta = new Map<string, number>();
    for (const c of candidatos) {
      for (const tag of new Set(c.tags))
        cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1);
    }
    return [...cuenta.entries()]
      .map(([nombre, cuantos]) => ({ nombre, cuantos }))
      .sort(
        (a, b) =>
          b.cuantos - a.cuantos || a.nombre.localeCompare(b.nombre, "es"),
      );
  }

  /**
   * Los candidatos que tienen todos los intereses elegidos. Todos y no
   * alguno: cada interés que se suma achica la lista, que es lo que se espera
   * de un filtro.
   */
  static filtrar(candidatos: Candidato[], intereses: string[]): Candidato[] {
    if (intereses.length === 0) return candidatos;
    return candidatos.filter((c) => {
      const propios = new Set(c.tags);
      return intereses.every((i) => propios.has(i));
    });
  }
}
