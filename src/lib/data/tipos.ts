import type {
  CategoriaTag,
  EstadoPostulacion,
  EventoAgendaRow,
  FormacionRow,
  PerfilRow,
  VacanteFeedRow,
} from "@/types/database";

export type Vacante = VacanteFeedRow;
export type Evento = EventoAgendaRow;

export type TagDePerfil = {
  slug: string;
  nombre: string;
  categoria: CategoriaTag;
  nivel: number;
};

export type Formacion = Omit<FormacionRow, "perfil_id">;

export type PerfilCompleto = PerfilRow & {
  tags: TagDePerfil[];
  formaciones: Formacion[];
};

export type PostulacionResumen = {
  id: string;
  estado: EstadoPostulacion;
  creado_en: string;
  vacante: {
    id: string;
    titulo: string;
    empresa: string;
    empresa_logo_url: string | null;
  };
};

/**
 * De dónde salieron los datos de la pantalla.
 *
 * `supabase` es una lectura real de la base; `ejemplo` significa que todavía
 * no hay credenciales cargadas o que las tablas están vacías, y se está
 * mostrando el contenido de demostración. La interfaz lo avisa en pantalla
 * para que nadie confunda una demo con datos de producción.
 */
export type OrigenDatos = "supabase" | "ejemplo";

export type Resultado<T> = {
  datos: T;
  origen: OrigenDatos;
  /** Mensaje del error de lectura, si lo hubo. */
  error?: string;
};
