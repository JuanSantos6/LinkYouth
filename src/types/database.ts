/**
 * Tipos del esquema de LinkYouth.
 *
 * Escritos a mano para que la aplicación compile sin conexión a Supabase.
 * Reflejan `db/migrations/`. Cuando el esquema esté aplicado en el proyecto,
 * este archivo se regenera desde la base real:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
 */

export type TipoOportunidad = "empleo" | "pasantia";
export type ModalidadTrabajo = "presencial" | "hibrido" | "remoto";
export type EstadoVacante = "activa" | "cerrada";
export type EstadoPostulacion =
  "pendiente" | "en_revision" | "rechazada" | "aceptada";
export type EstadoFormacion = "en_curso" | "finalizado" | "abandonado";
export type EstadoEvento = "publicado" | "cancelado";
export type CategoriaTag =
  | "tecnologia"
  | "diseno"
  | "datos"
  | "negocios"
  | "idiomas"
  | "habilidades_blandas";

type ConIdGenerado<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PerfilRow = {
  id: string;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  pais: string;
  ciudad: string | null;
  titular: string | null;
  biografia: string | null;
  avatar_url: string | null;
  verificado: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type EmpresaRow = {
  id: string;
  cuenta_id: string | null;
  razon_social: string;
  rubro: string;
  descripcion: string | null;
  logo_url: string | null;
  sitio_web: string | null;
  ubicacion: string | null;
  verificada: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type TagRow = {
  id: string;
  slug: string;
  nombre: string;
  categoria: CategoriaTag;
  creado_en: string;
};

export type PerfilTagRow = {
  perfil_id: string;
  tag_id: string;
  nivel: number;
  creado_en: string;
};

export type FormacionRow = {
  id: string;
  perfil_id: string;
  institucion: string;
  institucion_logo_url: string | null;
  titulo: string;
  estado: EstadoFormacion;
  anio_inicio: number | null;
  anio_fin: number | null;
  acreditada: boolean;
  creado_en: string;
};

export type VacanteRow = {
  id: string;
  empresa_id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoOportunidad;
  modalidad: ModalidadTrabajo;
  ubicacion: string | null;
  salario_min: number | null;
  salario_max: number | null;
  moneda: string;
  posiciones: number;
  estado: EstadoVacante;
  publicada_en: string;
  cerrada_en: string | null;
};

export type PostulacionRow = {
  id: string;
  vacante_id: string;
  perfil_id: string;
  estado: EstadoPostulacion;
  puntaje: number | null;
  mensaje: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type EventoRow = {
  id: string;
  empresa_id: string;
  titulo: string;
  descripcion: string;
  inicia_en: string;
  termina_en: string | null;
  modalidad: ModalidadTrabajo;
  ubicacion: string | null;
  imagen_url: string | null;
  cupo: number | null;
  estado: EstadoEvento;
  creado_en: string;
};

export type InscripcionRow = {
  evento_id: string;
  perfil_id: string;
  creado_en: string;
};

export type NotificacionRow = {
  id: string;
  perfil_id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  leida: boolean;
  creado_en: string;
};

/** Fila de la vista `vacantes_feed` (RF3.5.1). */
export type VacanteFeedRow = Omit<VacanteRow, "empresa_id" | "cerrada_en"> & {
  empresa_id: string;
  empresa: string;
  empresa_logo_url: string | null;
  empresa_rubro: string;
  empresa_verificada: boolean;
  tags: string[];
  postulaciones: number;
};

/** Fila de la vista `eventos_agenda` (RF4.4.1). */
export type EventoAgendaRow = Omit<EventoRow, "empresa_id" | "creado_en"> & {
  empresa_id: string;
  empresa: string;
  empresa_logo_url: string | null;
  tags: string[];
  inscriptos: number;
};

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: PerfilRow;
        Insert: ConIdGenerado<
          PerfilRow,
          | "pais"
          | "ciudad"
          | "titular"
          | "biografia"
          | "avatar_url"
          | "verificado"
          | "creado_en"
          | "actualizado_en"
        >;
        Update: Partial<PerfilRow>;
        Relationships: [];
      };
      empresas: {
        Row: EmpresaRow;
        Insert: ConIdGenerado<
          EmpresaRow,
          | "id"
          | "cuenta_id"
          | "descripcion"
          | "logo_url"
          | "sitio_web"
          | "ubicacion"
          | "verificada"
          | "creado_en"
          | "actualizado_en"
        >;
        Update: Partial<EmpresaRow>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: ConIdGenerado<TagRow, "id" | "creado_en">;
        Update: Partial<TagRow>;
        Relationships: [];
      };
      perfil_tags: {
        Row: PerfilTagRow;
        Insert: ConIdGenerado<PerfilTagRow, "nivel" | "creado_en">;
        Update: Partial<PerfilTagRow>;
        Relationships: [];
      };
      formaciones: {
        Row: FormacionRow;
        Insert: ConIdGenerado<
          FormacionRow,
          | "id"
          | "institucion_logo_url"
          | "estado"
          | "anio_inicio"
          | "anio_fin"
          | "acreditada"
          | "creado_en"
        >;
        Update: Partial<FormacionRow>;
        Relationships: [];
      };
      vacantes: {
        Row: VacanteRow;
        Insert: ConIdGenerado<
          VacanteRow,
          | "id"
          | "tipo"
          | "modalidad"
          | "ubicacion"
          | "salario_min"
          | "salario_max"
          | "moneda"
          | "posiciones"
          | "estado"
          | "publicada_en"
          | "cerrada_en"
        >;
        Update: Partial<VacanteRow>;
        Relationships: [];
      };
      vacante_tags: {
        Row: { vacante_id: string; tag_id: string };
        Insert: { vacante_id: string; tag_id: string };
        Update: Partial<{ vacante_id: string; tag_id: string }>;
        Relationships: [];
      };
      vacante_tags_ocultos: {
        Row: { vacante_id: string; tag_id: string; peso: number };
        Insert: { vacante_id: string; tag_id: string; peso?: number };
        Update: Partial<{ vacante_id: string; tag_id: string; peso: number }>;
        Relationships: [];
      };
      postulaciones: {
        Row: PostulacionRow;
        Insert: ConIdGenerado<
          PostulacionRow,
          | "id"
          | "estado"
          | "puntaje"
          | "mensaje"
          | "creado_en"
          | "actualizado_en"
        >;
        Update: Partial<PostulacionRow>;
        Relationships: [];
      };
      eventos: {
        Row: EventoRow;
        Insert: ConIdGenerado<
          EventoRow,
          | "id"
          | "termina_en"
          | "modalidad"
          | "ubicacion"
          | "imagen_url"
          | "cupo"
          | "estado"
          | "creado_en"
        >;
        Update: Partial<EventoRow>;
        Relationships: [];
      };
      evento_tags: {
        Row: { evento_id: string; tag_id: string };
        Insert: { evento_id: string; tag_id: string };
        Update: Partial<{ evento_id: string; tag_id: string }>;
        Relationships: [];
      };
      inscripciones: {
        Row: InscripcionRow;
        Insert: ConIdGenerado<InscripcionRow, "creado_en">;
        Update: Partial<InscripcionRow>;
        Relationships: [];
      };
      notificaciones: {
        Row: NotificacionRow;
        Insert: ConIdGenerado<
          NotificacionRow,
          "id" | "cuerpo" | "enlace" | "leida" | "creado_en"
        >;
        Update: Partial<NotificacionRow>;
        Relationships: [];
      };
    };
    Views: {
      vacantes_feed: { Row: VacanteFeedRow; Relationships: [] };
      eventos_agenda: { Row: EventoAgendaRow; Relationships: [] };
    };
    Functions: {
      afinidad_publica: {
        Args: { vacante: string; perfil: string };
        Returns: number;
      };
      puntaje_matching: {
        Args: { vacante: string; perfil: string };
        Returns: number;
      };
    };
    Enums: {
      tipo_oportunidad: TipoOportunidad;
      modalidad_trabajo: ModalidadTrabajo;
      estado_vacante: EstadoVacante;
      estado_postulacion: EstadoPostulacion;
      estado_formacion: EstadoFormacion;
      estado_evento: EstadoEvento;
      categoria_tag: CategoriaTag;
    };
    CompositeTypes: Record<string, never>;
  };
};
