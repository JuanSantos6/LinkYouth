export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      correos_pendientes: {
        Row: {
          asunto: string
          creado_en: string
          cuenta_id: string
          enlace: string | null
          enviado_en: string | null
          id: string
          intentos: number
          mensaje: string
          notificacion_id: string | null
          reclamado_en: string | null
          ultimo_error: string | null
        }
        Insert: {
          asunto: string
          creado_en?: string
          cuenta_id: string
          enlace?: string | null
          enviado_en?: string | null
          id?: string
          intentos?: number
          mensaje: string
          notificacion_id?: string | null
          reclamado_en?: string | null
          ultimo_error?: string | null
        }
        Update: {
          asunto?: string
          creado_en?: string
          cuenta_id?: string
          enlace?: string | null
          enviado_en?: string | null
          id?: string
          intentos?: number
          mensaje?: string
          notificacion_id?: string | null
          reclamado_en?: string | null
          ultimo_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correos_pendientes_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correos_pendientes_notificacion_id_fkey"
            columns: ["notificacion_id"]
            isOneToOne: false
            referencedRelation: "notificaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas: {
        Row: {
          creada_en: string
          eliminada: boolean
          id: string
          tipo: string
        }
        Insert: {
          creada_en?: string
          eliminada?: boolean
          id: string
          tipo: string
        }
        Update: {
          creada_en?: string
          eliminada?: boolean
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          creada_en: string
          descripcion: string | null
          id: string
          logo_url: string | null
          portada_url: string | null
          razon_social: string
          rubro: string
          rut: string | null
          sitio_web: string | null
        }
        Insert: {
          creada_en?: string
          descripcion?: string | null
          id: string
          logo_url?: string | null
          portada_url?: string | null
          razon_social: string
          rubro: string
          rut?: string | null
          sitio_web?: string | null
        }
        Update: {
          creada_en?: string
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          portada_url?: string | null
          razon_social?: string
          rubro?: string
          rut?: string | null
          sitio_web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_tags: {
        Row: {
          evento_id: string
          tag_id: string
        }
        Insert: {
          evento_id: string
          tag_id: string
        }
        Update: {
          evento_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_tags_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          descripcion: string
          direccion: string | null
          empresa_id: string
          estado: string
          fecha_hora: string
          id: string
          imagen_url: string | null
          latitud: number | null
          longitud: number | null
          titulo: string
        }
        Insert: {
          descripcion: string
          direccion?: string | null
          empresa_id: string
          estado?: string
          fecha_hora: string
          id?: string
          imagen_url?: string | null
          latitud?: number | null
          longitud?: number | null
          titulo: string
        }
        Update: {
          descripcion?: string
          direccion?: string | null
          empresa_id?: string
          estado?: string
          fecha_hora?: string
          id?: string
          imagen_url?: string | null
          latitud?: number | null
          longitud?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          alto: number
          ancho: number
          autor: string
          autor_enlace: string
          color: string | null
          creada_en: string
          descarga_avisada_en: string | null
          descripcion: string
          enlace: string
          unsplash_id: string
          url: string
        }
        Insert: {
          alto: number
          ancho: number
          autor: string
          autor_enlace: string
          color?: string | null
          creada_en?: string
          descarga_avisada_en?: string | null
          descripcion: string
          enlace: string
          unsplash_id: string
          url: string
        }
        Update: {
          alto?: number
          ancho?: number
          autor?: string
          autor_enlace?: string
          color?: string | null
          creada_en?: string
          descarga_avisada_en?: string | null
          descripcion?: string
          enlace?: string
          unsplash_id?: string
          url?: string
        }
        Relationships: []
      }
      formaciones: {
        Row: {
          estado: string
          id: string
          institucion: string
          perfil_id: string
          titulo: string
        }
        Insert: {
          estado: string
          id?: string
          institucion: string
          perfil_id: string
          titulo: string
        }
        Update: {
          estado?: string
          id?: string
          institucion?: string
          perfil_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "formaciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formaciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      habilidades: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      inscripciones_evento: {
        Row: {
          creada_en: string
          evento_id: string
          perfil_id: string
        }
        Insert: {
          creada_en?: string
          evento_id: string
          perfil_id: string
        }
        Update: {
          creada_en?: string
          evento_id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_evento_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_evento_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      lugares_con_foto: {
        Row: {
          lugar: string
          url: string
        }
        Insert: {
          lugar: string
          url: string
        }
        Update: {
          lugar?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lugares_con_foto_url_fkey"
            columns: ["url"]
            isOneToOne: false
            referencedRelation: "fotos"
            referencedColumns: ["url"]
          },
        ]
      }
      notificaciones: {
        Row: {
          creada_en: string
          cuenta_id: string
          enlace: string | null
          id: string
          leida: boolean
          mensaje: string
          tipo: string
        }
        Insert: {
          creada_en?: string
          cuenta_id: string
          enlace?: string | null
          id?: string
          leida?: boolean
          mensaje: string
          tipo: string
        }
        Update: {
          creada_en?: string
          cuenta_id?: string
          enlace?: string | null
          id?: string
          leida?: boolean
          mensaje?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_habilidades: {
        Row: {
          habilidad_id: string
          perfil_id: string
        }
        Insert: {
          habilidad_id: string
          perfil_id: string
        }
        Update: {
          habilidad_id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_habilidades_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_habilidades_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_habilidades_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_personalidad: {
        Row: {
          cargada_en: string
          perfil_id: string
          tipo: string
          visible_para_empresas: boolean
        }
        Insert: {
          cargada_en?: string
          perfil_id: string
          tipo: string
          visible_para_empresas?: boolean
        }
        Update: {
          cargada_en?: string
          perfil_id?: string
          tipo?: string
          visible_para_empresas?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "perfil_personalidad_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_personalidad_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_tags: {
        Row: {
          perfil_id: string
          tag_id: string
        }
        Insert: {
          perfil_id: string
          tag_id: string
        }
        Update: {
          perfil_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_tags_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_tags_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          apellido: string
          bio: string | null
          creado_en: string
          fecha_nacimiento: string
          foto_url: string | null
          id: string
          nombre: string
          nombre_usuario: string
          pais: string
        }
        Insert: {
          apellido: string
          bio?: string | null
          creado_en?: string
          fecha_nacimiento: string
          foto_url?: string | null
          id: string
          nombre: string
          nombre_usuario: string
          pais: string
        }
        Update: {
          apellido?: string
          bio?: string | null
          creado_en?: string
          fecha_nacimiento?: string
          foto_url?: string | null
          id?: string
          nombre?: string
          nombre_usuario?: string
          pais?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      postulaciones: {
        Row: {
          actualizada_en: string
          creada_en: string
          estado: string
          id: string
          perfil_id: string
          vacante_id: string
        }
        Insert: {
          actualizada_en?: string
          creada_en?: string
          estado?: string
          id?: string
          perfil_id: string
          vacante_id: string
        }
        Update: {
          actualizada_en?: string
          creada_en?: string
          estado?: string
          id?: string
          perfil_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulaciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postulaciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postulaciones_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      resenias: {
        Row: {
          calificacion: number
          comentario: string
          creada_en: string
          empresa_id: string
          id: string
          perfil_id: string
        }
        Insert: {
          calificacion: number
          comentario: string
          creada_en?: string
          empresa_id: string
          id?: string
          perfil_id: string
        }
        Update: {
          calificacion?: number
          comentario?: string
          creada_en?: string
          empresa_id?: string
          id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resenias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenias_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenias_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_de_tests: {
        Row: {
          cargado_en: string
          origen: string
          perfil_id: string
          puntaje: string | null
          resultado: string | null
          test: string
          visible_para_empresas: boolean
        }
        Insert: {
          perfil_id: string
          puntaje?: string | null
          resultado?: string | null
          test: string
          visible_para_empresas?: boolean
        }
        Update: {
          puntaje?: string | null
          resultado?: string | null
          visible_para_empresas?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "resultados_de_tests_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_de_tests_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      vacante_habilidades: {
        Row: {
          habilidad_id: string
          vacante_id: string
        }
        Insert: {
          habilidad_id: string
          vacante_id: string
        }
        Update: {
          habilidad_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacante_habilidades_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacante_habilidades_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      vacante_habilidades_ocultas: {
        Row: {
          habilidad_id: string
          vacante_id: string
        }
        Insert: {
          habilidad_id: string
          vacante_id: string
        }
        Update: {
          habilidad_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacante_habilidades_ocultas_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacante_habilidades_ocultas_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      vacante_tags_ocultos: {
        Row: {
          tag_id: string
          vacante_id: string
        }
        Insert: {
          tag_id: string
          vacante_id: string
        }
        Update: {
          tag_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacante_tags_ocultos_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacante_tags_ocultos_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      vacante_tags_publicos: {
        Row: {
          tag_id: string
          vacante_id: string
        }
        Insert: {
          tag_id: string
          vacante_id: string
        }
        Update: {
          tag_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacante_tags_publicos_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacante_tags_publicos_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      vacantes: {
        Row: {
          creada_en: string
          descripcion: string
          empresa_id: string
          estado: string
          id: string
          modalidad: string | null
          posiciones: number
          tipo: string
          titulo: string
          ubicacion: string | null
        }
        Insert: {
          creada_en?: string
          descripcion: string
          empresa_id: string
          estado?: string
          id?: string
          modalidad?: string | null
          posiciones: number
          tipo: string
          titulo: string
          ubicacion?: string | null
        }
        Update: {
          creada_en?: string
          descripcion?: string
          empresa_id?: string
          estado?: string
          id?: string
          modalidad?: string | null
          posiciones?: number
          tipo?: string
          titulo?: string
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      formaciones_publicas: {
        Row: {
          institucion: string | null
          titulo: string | null
        }
        Relationships: []
      }
      perfiles_publicos: {
        Row: {
          id: string | null
          nombre_usuario: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      candidatos_de_mi_empresa: {
        Args: { ids: string[] }
        Returns: {
          apellido: string
          bio: string | null
          foto_url: string | null
          id: string
          nombre: string
          nombre_usuario: string
          pais: string
        }[]
      }
      cuenta_activa: { Args: { cuenta: string }; Returns: boolean }
      eliminar_mi_cuenta: { Args: never; Returns: undefined }
      perfil_publico: {
        Args: { usuario: string }
        Returns: {
          id: string
          nombre_usuario: string
          foto_url: string | null
          bio: string | null
          tags: string[]
        }[]
      }
      reclamar_correos_pendientes: {
        Args: { limite?: number }
        Returns: {
            asunto: string
            creado_en: string
            cuenta_id: string
            enlace: string | null
            enviado_en: string | null
            id: string
            intentos: number
            mensaje: string
            notificacion_id: string | null
            reclamado_en: string | null
            ultimo_error: string | null
        }[]
      }
      resenias_de_empresa: {
        Args: { empresa: string }
        Returns: {
          id: string
          calificacion: number
          comentario: string
          creada_en: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
