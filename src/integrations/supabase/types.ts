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
      contacts: {
        Row: {
          channel: Json | null
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          meta: Json | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          channel?: Json | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          meta?: Json | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: Json | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          meta?: Json | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          priority: string | null
          sla_due_at: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          priority?: string | null
          sla_due_at?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          priority?: string | null
          sla_due_at?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      digital_presence: {
        Row: {
          company_id: string
          created_at: string
          engagement_score: number | null
          facebook_data: Json | null
          id: string
          instagram_data: Json | null
          last_updated: string
          linkedin_data: Json | null
          overall_score: number | null
          social_score: number | null
          twitter_data: Json | null
          web_score: number | null
          website_metrics: Json | null
          youtube_data: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          engagement_score?: number | null
          facebook_data?: Json | null
          id?: string
          instagram_data?: Json | null
          last_updated?: string
          linkedin_data?: Json | null
          overall_score?: number | null
          social_score?: number | null
          twitter_data?: Json | null
          web_score?: number | null
          website_metrics?: Json | null
          youtube_data?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          engagement_score?: number | null
          facebook_data?: Json | null
          id?: string
          instagram_data?: Json | null
          last_updated?: string
          linkedin_data?: Json | null
          overall_score?: number | null
          social_score?: number | null
          twitter_data?: Json | null
          web_score?: number | null
          website_metrics?: Json | null
          youtube_data?: Json | null
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          company_id: string
          created_at: string
          credit_score: number | null
          debt_indicators: Json | null
          financial_indicators: Json | null
          id: string
          last_updated: string
          payment_history: Json | null
          predictive_risk_score: number | null
          risk_classification: string | null
          scpc_data: Json | null
          serasa_data: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          credit_score?: number | null
          debt_indicators?: Json | null
          financial_indicators?: Json | null
          id?: string
          last_updated?: string
          payment_history?: Json | null
          predictive_risk_score?: number | null
          risk_classification?: string | null
          scpc_data?: Json | null
          serasa_data?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          credit_score?: number | null
          debt_indicators?: Json | null
          financial_indicators?: Json | null
          id?: string
          last_updated?: string
          payment_history?: Json | null
          predictive_risk_score?: number | null
          risk_classification?: string | null
          scpc_data?: Json | null
          serasa_data?: Json | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          company_id: string
          confidence_score: number | null
          created_at: string
          description: string | null
          generated_by: string | null
          id: string
          insight_type: string
          priority: string | null
          title: string
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          generated_by?: string | null
          id?: string
          insight_type: string
          priority?: string | null
          title: string
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          generated_by?: string | null
          id?: string
          insight_type?: string
          priority?: string | null
          title?: string
        }
        Relationships: []
      }
      legal_data: {
        Row: {
          active_processes: number | null
          ceis_data: Json | null
          cnep_data: Json | null
          company_id: string
          created_at: string
          id: string
          jusbrasil_data: Json | null
          last_checked: string
          legal_health_score: number | null
          risk_level: string | null
          total_processes: number | null
        }
        Insert: {
          active_processes?: number | null
          ceis_data?: Json | null
          cnep_data?: Json | null
          company_id: string
          created_at?: string
          id?: string
          jusbrasil_data?: Json | null
          last_checked?: string
          legal_health_score?: number | null
          risk_level?: string | null
          total_processes?: number | null
        }
        Update: {
          active_processes?: number | null
          ceis_data?: Json | null
          cnep_data?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          jusbrasil_data?: Json | null
          last_checked?: string
          legal_health_score?: number | null
          risk_level?: string | null
          total_processes?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          body: string | null
          channel: string
          conversation_id: string | null
          created_at: string | null
          direction: string
          from_id: string | null
          id: string
          provider_message_id: string | null
          raw: Json | null
          status: string | null
          to_id: string | null
        }
        Insert: {
          attachments?: Json | null
          body?: string | null
          channel: string
          conversation_id?: string | null
          created_at?: string | null
          direction: string
          from_id?: string | null
          id?: string
          provider_message_id?: string | null
          raw?: Json | null
          status?: string | null
          to_id?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string | null
          channel?: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          from_id?: string | null
          id?: string
          provider_message_id?: string | null
          raw?: Json | null
          status?: string | null
          to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_mentions: {
        Row: {
          company_id: string
          content_summary: string | null
          created_at: string
          id: string
          published_at: string | null
          raw_data: Json | null
          sentiment: string | null
          sentiment_score: number | null
          source: string | null
          title: string
          url: string | null
        }
        Insert: {
          company_id: string
          content_summary?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          raw_data?: Json | null
          sentiment?: string | null
          sentiment_score?: number | null
          source?: string | null
          title: string
          url?: string | null
        }
        Update: {
          company_id?: string
          content_summary?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          raw_data?: Json | null
          sentiment?: string | null
          sentiment_score?: number | null
          source?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      pitches: {
        Row: {
          company_id: string
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          pitch_type: string
          target_persona: string | null
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          pitch_type: string
          target_persona?: string | null
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          pitch_type?: string
          target_persona?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reputation_data: {
        Row: {
          company_id: string
          created_at: string
          google_reviews_data: Json | null
          id: string
          last_updated: string
          overall_rating: number | null
          reclame_aqui_data: Json | null
          reputation_score: number | null
          sentiment_score: number | null
          total_reviews: number | null
          trustpilot_data: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          google_reviews_data?: Json | null
          id?: string
          last_updated?: string
          overall_rating?: number | null
          reclame_aqui_data?: Json | null
          reputation_score?: number | null
          sentiment_score?: number | null
          total_reviews?: number | null
          trustpilot_data?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          google_reviews_data?: Json | null
          id?: string
          last_updated?: string
          overall_rating?: number | null
          reclame_aqui_data?: Json | null
          reputation_score?: number | null
          sentiment_score?: number | null
          total_reviews?: number | null
          trustpilot_data?: Json | null
        }
        Relationships: []
      }
      risks: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          detected_at: string
          id: string
          raw_data: Json | null
          risk_type: string
          severity: string
          source: string | null
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          raw_data?: Json | null
          risk_type: string
          severity: string
          source?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          raw_data?: Json | null
          risk_type?: string
          severity?: string
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      sdr_audit: {
        Row: {
          action: string
          created_at: string | null
          entity: string
          entity_id: string
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity: string
          entity_id: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity?: string
          entity_id?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      sdr_routing_rules: {
        Row: {
          active: boolean | null
          assign_to: string | null
          conditions: Json
          created_at: string | null
          id: string
          name: string
          priority: string | null
          sla_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          assign_to?: string | null
          conditions?: Json
          created_at?: string | null
          id?: string
          name: string
          priority?: string | null
          sla_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          assign_to?: string | null
          conditions?: Json
          created_at?: string | null
          id?: string
          name?: string
          priority?: string | null
          sla_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sdr_sequence_runs: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          current_step: number | null
          id: string
          last_sent_at: string | null
          next_due_at: string | null
          sequence_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          last_sent_at?: string | null
          next_due_at?: string | null
          sequence_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          last_sent_at?: string | null
          next_due_at?: string | null
          sequence_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_sequence_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_sequence_runs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_sequence_runs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sdr_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_sequence_steps: {
        Row: {
          channel: string
          created_at: string | null
          day_offset: number
          id: string
          sequence_id: string | null
          skip_weekends: boolean | null
          step_order: number
          stop_on_reply: boolean | null
          template_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          day_offset?: number
          id?: string
          sequence_id?: string | null
          skip_weekends?: boolean | null
          step_order: number
          stop_on_reply?: boolean | null
          template_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          day_offset?: number
          id?: string
          sequence_id?: string | null
          skip_weekends?: boolean | null
          step_order?: number
          stop_on_reply?: boolean | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sdr_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sdr_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_sequences: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sdr_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          reminders: Json | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          reminders?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          reminders?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_templates: {
        Row: {
          channel: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          language: string | null
          name: string
          subject: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          channel: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          language?: string | null
          name: string
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          language?: string | null
          name?: string
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "viewer"
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
    Enums: {
      app_role: ["admin", "user", "viewer"],
    },
  },
} as const
