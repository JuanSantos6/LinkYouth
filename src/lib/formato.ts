import type { EstadoFormacion, TipoOportunidad } from "@/lib/data/tipos";

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

/**
 * "18:30". Horario de 24 h: es el formato de una agenda, no de una charla.
 *
 * `eventos` guarda un único `fecha_hora`: el esquema no tiene hora de fin, así
 * que no hay rango que mostrar.
 */
export function hora(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONA,
  }).format(new Date(iso));
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

export function etiquetaTipo(tipo: TipoOportunidad): string {
  return tipo === "pasantia" ? "Pasantía" : "Empleo";
}

export function etiquetaEstadoFormacion(estado: EstadoFormacion): string {
  return estado === "en_curso" ? "En curso" : "Finalizado";
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
