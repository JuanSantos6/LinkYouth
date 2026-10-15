import type { ErroresDeCampo } from "@/lib/dominio/ReglasDeBusqueda";

/** Lo que manda el formulario de un evento, ya leído del `FormData`. */
export type DatosDeEvento = {
  titulo: string;
  descripcion: string;
  /** `YYYY-MM-DDTHH:mm`, la hora de Montevideo, como la da `datetime-local`. */
  fechaHora: string;
  direccion: string;
  /** Texto tal como se escribió: acepta coma o punto decimal. */
  latitud: string;
  longitud: string;
  tags: string[];
};

/**
 * Zona de los eventos. Todos son en Uruguay, y la interfaz ya los muestra en
 * esta zona (`src/lib/formato.ts`): si el formulario interpretara la hora en la
 * zona del servidor, un evento cargado a las 18:30 aparecería a las 15:30.
 */
const ZONA = "America/Montevideo";

/** Los componentes de una fecha vista en `ZONA`. */
function partesEnZona(instante: Date): Record<string, number> {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instante);
  return Object.fromEntries(
    partes
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, Number(parte.value)]),
  );
}

/**
 * Las reglas de un evento institucional (RF4.1, RF4.2, RF4.3).
 *
 * Mismo criterio que `ReglasDeBusqueda`: los límites salen de acá hacia el
 * formulario y hacia la acción de servidor.
 */
export class ReglasDeEvento {
  static readonly TITULO_MIN = 4;
  static readonly TITULO_MAX = 90;
  static readonly DESCRIPCION_MIN = 20;
  static readonly DESCRIPCION_MAX = 2000;
  static readonly DIRECCION_MAX = 160;
  static readonly TAGS_MAX = 6;

  /**
   * La hora de Montevideo escrita en el formulario, como instante ISO.
   *
   * La diferencia con UTC se calcula con `Intl` en vez de escribir «-03:00»:
   * si Uruguay vuelve a tener horario de verano, esto sigue andando.
   */
  static deHoraLocal(texto: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(texto.trim());
    if (!m) return null;
    const [, anio, mes, dia, hora, minuto] = m.map(Number);

    const comoSiFueraUtc = Date.UTC(anio, mes - 1, dia, hora, minuto);

    // `Date.UTC` no rechaza nada: el mes 13 o el día 40 los «normaliza» en
    // silencio a otra fecha válida. Si al leerla de vuelta no es la misma que
    // se escribió, la fecha no existe.
    const leida = new Date(comoSiFueraUtc);
    if (
      leida.getUTCFullYear() !== anio ||
      leida.getUTCMonth() !== mes - 1 ||
      leida.getUTCDate() !== dia ||
      leida.getUTCHours() !== hora ||
      leida.getUTCMinutes() !== minuto
    ) {
      return null;
    }

    const p = partesEnZona(leida);
    const vistoEnZona = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const instante = new Date(comoSiFueraUtc - (vistoEnZona - comoSiFueraUtc));

    return Number.isNaN(instante.getTime()) ? null : instante;
  }

  /** Lo inverso: un instante guardado, como valor de `datetime-local`. */
  static aHoraLocal(iso: string): string {
    const p = partesEnZona(new Date(iso));
    const dos = (n: number) => String(n).padStart(2, "0");
    return `${p.year}-${dos(p.month)}-${dos(p.day)}T${dos(p.hour)}:${dos(p.minute)}`;
  }

  /** Lee una coordenada escrita a mano: «-34,9055» o «-34.9055». */
  static leerCoordenada(texto: string): number | null {
    const limpio = texto.trim().replace(",", ".");
    if (!limpio) return null;
    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : Number.NaN;
  }

  static validar(datos: DatosDeEvento, ahora = new Date()): ErroresDeCampo {
    const errores: ErroresDeCampo = {};
    const titulo = datos.titulo.trim();
    const descripcion = datos.descripcion.trim();

    if (titulo.length < this.TITULO_MIN) {
      errores.titulo = `Poné un título de al menos ${this.TITULO_MIN} caracteres.`;
    } else if (titulo.length > this.TITULO_MAX) {
      errores.titulo = `El título no puede pasar de ${this.TITULO_MAX} caracteres.`;
    }

    if (descripcion.length < this.DESCRIPCION_MIN) {
      errores.descripcion = `Contá de qué se trata en al menos ${this.DESCRIPCION_MIN} caracteres.`;
    } else if (descripcion.length > this.DESCRIPCION_MAX) {
      errores.descripcion = `La descripción no puede pasar de ${this.DESCRIPCION_MAX} caracteres.`;
    }

    const instante = this.deHoraLocal(datos.fechaHora);
    if (!instante) {
      errores.fechaHora = "Elegí el día y la hora.";
    } else if (instante <= ahora) {
      errores.fechaHora = "La fecha tiene que ser en el futuro.";
    }

    if (datos.direccion.trim().length > this.DIRECCION_MAX) {
      errores.direccion = `La dirección no puede pasar de ${this.DIRECCION_MAX} caracteres.`;
    }

    // Las coordenadas van juntas o no van: una sola no ubica nada.
    const lat = this.leerCoordenada(datos.latitud);
    const lng = this.leerCoordenada(datos.longitud);
    if ((lat === null) !== (lng === null)) {
      errores.latitud =
        "Completá la latitud y la longitud, o dejá las dos vacías.";
    } else if (lat !== null && lng !== null) {
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        errores.latitud = "La latitud va de -90 a 90, por ejemplo -34,9055.";
      }
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        errores.longitud =
          "La longitud va de -180 a 180, por ejemplo -56,1913.";
      }
    }

    if (datos.tags.length > this.TAGS_MAX) {
      errores.tags = `Elegí hasta ${this.TAGS_MAX} áreas.`;
    }

    return errores;
  }

  /**
   * Enlace «Ver en el mapa» a OpenStreetMap, o `null` si no hay con qué.
   *
   * Un enlace y no un mapa embebido: un mapa obliga a abrir la política de
   * contenido y hace que el navegador de cada visitante le pida datos a un
   * tercero. Con coordenadas marca el punto exacto; sin ellas, busca la
   * dirección.
   */
  static enlaceAlMapa(evento: {
    latitud: number | null;
    longitud: number | null;
    direccion: string | null;
  }): string | null {
    if (evento.latitud !== null && evento.longitud !== null) {
      const { latitud: lat, longitud: lng } = evento;
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
    }
    if (evento.direccion?.trim()) {
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(evento.direccion.trim())}`;
    }
    return null;
  }

  /** Se edita y se cancela mientras esté activo y no haya pasado. */
  static puedeModificar(
    evento: { estado: string; fecha_hora: string },
    ahora = new Date(),
  ): boolean {
    return evento.estado === "activo" && new Date(evento.fecha_hora) > ahora;
  }
}
