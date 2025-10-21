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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buying_signals: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          detected_at: string
          id: string
          raw_data: Json | null
          signal_type: string
          source: string | null
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          raw_data?: Json | null
          signal_type: string
          source?: string | null
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          raw_data?: Json | null
          signal_type?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buying_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas: {
        Row: {
          company_id: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          is_template: boolean | null
          last_edited_by: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean | null
          last_edited_by?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean | null
          last_edited_by?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_comments: {
        Row: {
          assigned_to: string | null
          canvas_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          status: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          canvas_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          canvas_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_comments_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvas"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_versions: {
        Row: {
          canvas_id: string
          change_summary: string | null
          content: Json
          created_at: string
          created_by: string
          id: string
          version_number: number
        }
        Insert: {
          canvas_id: string
          change_summary?: string | null
          content: Json
          created_at?: string
          created_by: string
          id?: string
          version_number: number
        }
        Update: {
          canvas_id?: string
          change_summary?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "canvas_versions_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvas"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          digital_maturity_score: number | null
          domain: string | null
          employees: number | null
          id: string
          industry: string | null
          linkedin_url: string | null
          location: Json | null
          name: string
          raw_data: Json | null
          revenue: string | null
          technologies: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          digital_maturity_score?: number | null
          domain?: string | null
          employees?: number | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: Json | null
          name: string
          raw_data?: Json | null
          revenue?: string | null
          technologies?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          digital_maturity_score?: number | null
          domain?: string | null
          employees?: number | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: Json | null
          name?: string
          raw_data?: Json | null
          revenue?: string | null
          technologies?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      decision_makers: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          raw_data: Json | null
          seniority: string | null
          title: string | null
          updated_at: string
          verified_email: boolean | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          raw_data?: Json | null
          seniority?: string | null
          title?: string | null
          updated_at?: string
          verified_email?: boolean | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          raw_data?: Json | null
          seniority?: string | null
          title?: string | null
          updated_at?: string
          verified_email?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_makers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_maturity: {
        Row: {
          analysis_data: Json | null
          company_id: string | null
          created_at: string
          id: string
          infrastructure_score: number | null
          innovation_score: number | null
          overall_score: number | null
          processes_score: number | null
          security_score: number | null
          systems_score: number | null
          updated_at: string
        }
        Insert: {
          analysis_data?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          infrastructure_score?: number | null
          innovation_score?: number | null
          overall_score?: number | null
          processes_score?: number | null
          security_score?: number | null
          systems_score?: number | null
          updated_at?: string
        }
        Update: {
          analysis_data?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          infrastructure_score?: number | null
          innovation_score?: number | null
          overall_score?: number | null
          processes_score?: number | null
          security_score?: number | null
          systems_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_maturity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          query: string
          results_count: number | null
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
