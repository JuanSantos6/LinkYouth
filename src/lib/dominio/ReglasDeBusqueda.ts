import type {
  EstadoVacante,
  Modalidad,
  TipoOportunidad,
} from "@/lib/data/tipos";
import { MODALIDADES, TIPOS_OPORTUNIDAD } from "@/lib/data/tipos";

/** Lo que manda el formulario de una búsqueda, ya leído del `FormData`. */
export type DatosDeBusqueda = {
  titulo: string;
  descripcion: string;
  tipo: string;
  modalidad: string;
  ubicacion: string;
  posiciones: number;
  /** Ids del catálogo. Las públicas se muestran en la publicación. */
  habilidades: string[];
  /** Las que pide sin publicarlas (RF3.1.6): solo las ve la empresa. */
  habilidadesOcultas: string[];
  tags: string[];
  tagsOcultos: string[];
};

/** Errores por campo: el nombre del campo y lo que hay que corregir. */
export type ErroresDeCampo = Partial<Record<string, string>>;

export const ETIQUETA_MODALIDAD: Record<Modalidad, string> = {
  presencial: "Presencial",
  remota: "Remota",
  hibrida: "Híbrida",
};

export const ETIQUETA_ESTADO_BUSQUEDA: Record<EstadoVacante, string> = {
  activa: "Activa",
  pausada: "Pausada",
  cerrada: "Cerrada",
};

/** Lo que la empresa puede hacer con el estado de una búsqueda. */
export type AccionDeBusqueda = "pausar" | "reactivar" | "cerrar";

const ACCIONES: Record<EstadoVacante, readonly AccionDeBusqueda[]> = {
  activa: ["pausar", "cerrar"],
  pausada: ["reactivar", "cerrar"],
  // Cerrar es final: las pendientes ya pasaron a rechazada (RF3.3.3) y
  // reabrir les volvería a prometer algo a quienes ya les dijimos que no.
  cerrada: [],
};

const DESTINO: Record<AccionDeBusqueda, EstadoVacante> = {
  pausar: "pausada",
  reactivar: "activa",
  cerrar: "cerrada",
};

const ETIQUETA_ACCION: Record<AccionDeBusqueda, string> = {
  pausar: "Pausar",
  reactivar: "Reactivar",
  cerrar: "Cerrar búsqueda",
};

/**
 * Las reglas de una búsqueda (RF3.1, RF3.2, RF3.3).
 *
 * Cada límite existe tres veces —atributo del campo, comprobación en la acción
 * de servidor y, cuando corresponde, restricción de la base— y las tres tienen
 * que decir lo mismo. Salen de acá. Mismo criterio que `ReglasDeRegistro`.
 */
export class ReglasDeBusqueda {
  static readonly TITULO_MIN = 4;
  static readonly TITULO_MAX = 90;
  static readonly DESCRIPCION_MIN = 40;
  static readonly DESCRIPCION_MAX = 4000;
  static readonly UBICACION_MAX = 120;
  static readonly POSICIONES_MIN = 1;
  static readonly POSICIONES_MAX = 50;
  /**
   * Sin al menos una habilidad no hay con qué ordenar a los postulantes. Los
   * dos límites cuentan las públicas y las ocultas juntas.
   */
  static readonly HABILIDADES_MIN = 1;
  static readonly HABILIDADES_MAX = 10;
  static readonly TAGS_MAX = 8;
  static readonly OCULTOS_MAX = 8;

  /** La ubicación se pide salvo en remota, donde «dónde» no aplica. */
  static pideUbicacion(modalidad: string): boolean {
    return modalidad !== "remota";
  }

  static validar(datos: DatosDeBusqueda): ErroresDeCampo {
    const errores: ErroresDeCampo = {};
    const titulo = datos.titulo.trim();
    const descripcion = datos.descripcion.trim();

    if (titulo.length < this.TITULO_MIN) {
      errores.titulo = `Poné un título de al menos ${this.TITULO_MIN} caracteres.`;
    } else if (titulo.length > this.TITULO_MAX) {
      errores.titulo = `El título no puede pasar de ${this.TITULO_MAX} caracteres.`;
    }

    if (descripcion.length < this.DESCRIPCION_MIN) {
      errores.descripcion = `Contá un poco más: la descripción necesita al menos ${this.DESCRIPCION_MIN} caracteres.`;
    } else if (descripcion.length > this.DESCRIPCION_MAX) {
      errores.descripcion = `La descripción no puede pasar de ${this.DESCRIPCION_MAX} caracteres.`;
    }

    if (!(TIPOS_OPORTUNIDAD as readonly string[]).includes(datos.tipo)) {
      errores.tipo = "Elegí si es un empleo o una pasantía.";
    }

    if (!(MODALIDADES as readonly string[]).includes(datos.modalidad)) {
      errores.modalidad = "Elegí la modalidad.";
    }

    const ubicacion = datos.ubicacion.trim();
    if (this.pideUbicacion(datos.modalidad) && !ubicacion) {
      errores.ubicacion = "Decinos dónde es el trabajo.";
    } else if (ubicacion.length > this.UBICACION_MAX) {
      errores.ubicacion = `La ubicación no puede pasar de ${this.UBICACION_MAX} caracteres.`;
    }

    if (
      !Number.isInteger(datos.posiciones) ||
      datos.posiciones < this.POSICIONES_MIN ||
      datos.posiciones > this.POSICIONES_MAX
    ) {
      errores.posiciones = `Las posiciones van de ${this.POSICIONES_MIN} a ${this.POSICIONES_MAX}.`;
    }

    const pedidas = datos.habilidades.length + datos.habilidadesOcultas.length;
    const enLasDos = datos.habilidades.some((id) =>
      datos.habilidadesOcultas.includes(id),
    );
    if (pedidas < this.HABILIDADES_MIN) {
      errores.habilidades = "Elegí al menos una habilidad que pidas.";
    } else if (pedidas > this.HABILIDADES_MAX) {
      errores.habilidades = `Elegí hasta ${this.HABILIDADES_MAX} habilidades: más que eso deja afuera a todo el mundo.`;
    } else if (enLasDos) {
      errores.habilidades =
        "Cada habilidad es pública u oculta, no las dos. Revisá las marcadas.";
    }

    if (datos.tags.length > this.TAGS_MAX) {
      errores.tags = `Elegí hasta ${this.TAGS_MAX} áreas.`;
    }

    if (datos.tagsOcultos.length > this.OCULTOS_MAX) {
      errores.tagsOcultos = `Elegí hasta ${this.OCULTOS_MAX} intereses clave.`;
    }

    return errores;
  }

  static comoTipo(valor: string): TipoOportunidad {
    return valor === "pasantia" ? "pasantia" : "empleo";
  }

  static acciones(
    estado: EstadoVacante,
  ): { accion: AccionDeBusqueda; etiqueta: string }[] {
    return ACCIONES[estado].map((accion) => ({
      accion,
      etiqueta: ETIQUETA_ACCION[accion],
    }));
  }

  /** El estado al que lleva una acción, o `null` si no corresponde desde `actual`. */
  static estadoTras(
    actual: EstadoVacante,
    accion: string,
  ): EstadoVacante | null {
    const permitida = ACCIONES[actual].find((posible) => posible === accion);
    return permitida ? DESTINO[permitida] : null;
  }

  /**
   * Una búsqueda se borra solo si nadie se postuló. Con postulaciones se
   * cierra: las postulaciones no se borran nunca (CLAUDE.md). La base lo exige
   * igual con una política; esto es para no ofrecer un botón que va a fallar.
   */
  static puedeEliminar(postulaciones: number): boolean {
    return postulaciones === 0;
  }

  /** Se edita mientras no esté cerrada: cerrada es un estado final. */
  static puedeEditar(estado: EstadoVacante): boolean {
    return estado !== "cerrada";
  }
}
