import type {
  EstadoPostulacion,
  ModalidadTrabajo,
  TipoOportunidad,
} from "@/types/database";

const ZONA = "America/Montevideo";
const LOCALE = "es-UY";

/** "sábado 15 de octubre". La hora la pone `rangoHorario`, no se repite acá. */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZONA,
  }).format(new Date(iso));
}

/** Día y mes abreviado para el bloque de fecha de un evento: { dia: "15", mes: "OCT" } */
export function fechaBloque(iso: string): { dia: string; mes: string } {
  const fecha = new Date(iso);
  const dia = new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    timeZone: ZONA,
  }).format(fecha);
  const mes = new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    timeZone: ZONA,
  })
    .format(fecha)
    .replace(".", "")
    .toUpperCase();

  return { dia, mes };
}

/** "18:30 a 20:30". Horario de 24 h: es el formato de una agenda, no de una charla. */
export function rangoHorario(inicio: string, fin: string | null): string {
  const formato = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONA,
  });

  const desde = formato.format(new Date(inicio));
  if (!fin) return desde;

  return `${desde} a ${formato.format(new Date(fin))}`;
}

/** "hace 2 horas", "hace 3 días" */
export function tiempoRelativo(iso: string): string {
  const formato = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const diferencia = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(diferencia / 60_000);

  if (minutos < 60) return formato.format(-minutos, "minute");

  const horas = Math.round(minutos / 60);
  if (horas < 24) return formato.format(-horas, "hour");

  const dias = Math.round(horas / 24);
  if (dias < 30) return formato.format(-dias, "day");

  return formato.format(-Math.round(dias / 30), "month");
}

/** "USD 1.500 a 2.000 por mes", o null si la vacante no publica salario. */
export function rangoSalarial(
  min: number | null,
  max: number | null,
  moneda: string,
): string | null {
  if (min === null && max === null) return null;

  const numero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

  if (min !== null && max !== null) {
    return `${moneda} ${numero.format(min)} a ${numero.format(max)} por mes`;
  }

  const unico = (min ?? max) as number;
  const prefijo = min !== null ? "desde" : "hasta";

  return `${moneda} ${prefijo} ${numero.format(unico)} por mes`;
}

export function etiquetaModalidad(modalidad: ModalidadTrabajo): string {
  const etiquetas: Record<ModalidadTrabajo, string> = {
    presencial: "Presencial",
    hibrido: "Híbrido",
    remoto: "Remoto",
  };

  return etiquetas[modalidad];
}

export function etiquetaTipo(tipo: TipoOportunidad): string {
  return tipo === "pasantia" ? "Pasantía" : "Empleo";
}

export function etiquetaEstadoPostulacion(estado: EstadoPostulacion): string {
  const etiquetas: Record<EstadoPostulacion, string> = {
    pendiente: "Enviada",
    en_revision: "En revisión",
    rechazada: "No seleccionada",
    aceptada: "Aceptada",
  };

  return etiquetas[estado];
}

/** Iniciales para el avatar cuando no hay foto cargada. */
export function iniciales(texto: string): string {
  return texto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? "")
    .join("");
}

/** Compatibilidad entre los tags de una vacante y los del postulante (RF3.5.2). */
export function afinidad(tagsVacante: string[], tagsPerfil: string[]): number {
  if (tagsVacante.length === 0) return 0;

  const propios = new Set(tagsPerfil.map((tag) => tag.toLowerCase()));
  const coinciden = tagsVacante.filter((tag) =>
    propios.has(tag.toLowerCase()),
  ).length;

  return Math.round((100 * coinciden) / tagsVacante.length);
}
