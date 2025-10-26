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
      account_strategies: {
        Row: {
          ai_insights: Json | null
          ai_recommendations: Json | null
          annual_value: number | null
          approach_strategy: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          current_stage: string | null
          decision_maker_id: string | null
          engagement_level: string | null
          expected_timeline: string | null
          id: string
          identified_gaps: Json | null
          investment_required: number | null
          last_touchpoint_at: string | null
          next_action_due: string | null
          payback_period: string | null
          persona_id: string | null
          priority: string | null
          projected_roi: number | null
          recommended_products: Json | null
          relationship_score: number | null
          stakeholder_map: Json | null
          status: string | null
          transformation_roadmap: Json | null
          updated_at: string | null
          value_proposition: string | null
        }
        Insert: {
          ai_insights?: Json | null
          ai_recommendations?: Json | null
          annual_value?: number | null
          approach_strategy?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: string | null
          decision_maker_id?: string | null
          engagement_level?: string | null
          expected_timeline?: string | null
          id?: string
          identified_gaps?: Json | null
          investment_required?: number | null
          last_touchpoint_at?: string | null
          next_action_due?: string | null
          payback_period?: string | null
          persona_id?: string | null
          priority?: string | null
          projected_roi?: number | null
          recommended_products?: Json | null
          relationship_score?: number | null
          stakeholder_map?: Json | null
          status?: string | null
          transformation_roadmap?: Json | null
          updated_at?: string | null
          value_proposition?: string | null
        }
        Update: {
          ai_insights?: Json | null
          ai_recommendations?: Json | null
          annual_value?: number | null
          approach_strategy?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: string | null
          decision_maker_id?: string | null
          engagement_level?: string | null
          expected_timeline?: string | null
          id?: string
          identified_gaps?: Json | null
          investment_required?: number | null
          last_touchpoint_at?: string | null
          next_action_due?: string | null
          payback_period?: string | null
          persona_id?: string | null
          priority?: string | null
          projected_roi?: number | null
          recommended_products?: Json | null
          relationship_score?: number | null
          stakeholder_map?: Json | null
          status?: string | null
          transformation_roadmap?: Json | null
          updated_at?: string | null
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_strategies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_strategies_decision_maker_id_fkey"
            columns: ["decision_maker_id"]
            isOneToOne: false
            referencedRelation: "decision_makers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_strategies_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "buyer_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      account_touchpoints: {
        Row: {
          account_strategy_id: string | null
          attachments: Json | null
          channel: string | null
          company_id: string | null
          completed_at: string | null
          completed_by: string | null
          content: string | null
          created_at: string | null
          id: string
          meeting_duration_minutes: number | null
          next_action_due: string | null
          next_action_owner: string | null
          next_steps: string | null
          outcome: string | null
          related_tasks: Json | null
          response_received: boolean | null
          response_time_hours: number | null
          sentiment: string | null
          stage: string
          subject: string | null
          touchpoint_type: string
        }
        Insert: {
          account_strategy_id?: string | null
          attachments?: Json | null
          channel?: string | null
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          meeting_duration_minutes?: number | null
          next_action_due?: string | null
          next_action_owner?: string | null
          next_steps?: string | null
          outcome?: string | null
          related_tasks?: Json | null
          response_received?: boolean | null
          response_time_hours?: number | null
          sentiment?: string | null
          stage: string
          subject?: string | null
          touchpoint_type: string
        }
        Update: {
          account_strategy_id?: string | null
          attachments?: Json | null
          channel?: string | null
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          meeting_duration_minutes?: number | null
          next_action_due?: string | null
          next_action_owner?: string | null
          next_steps?: string | null
          outcome?: string | null
          related_tasks?: Json | null
          response_received?: boolean | null
          response_time_hours?: number | null
          sentiment?: string | null
          stage?: string
          subject?: string | null
          touchpoint_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_touchpoints_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_touchpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          attachments: Json | null
          company_id: string | null
          contact_email: string | null
          contact_id: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_role: string | null
          created_at: string | null
          created_by: string | null
          decision_maker_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          next_action_date: string | null
          next_steps: string | null
          outcome: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          attachments?: Json | null
          company_id?: string | null
          contact_email?: string | null
          contact_id?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_maker_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          next_action_date?: string | null
          next_steps?: string | null
          outcome?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          attachments?: Json | null
          company_id?: string | null
          contact_email?: string | null
          contact_id?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_maker_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          next_action_date?: string | null
          next_steps?: string | null
          outcome?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_decision_maker_id_fkey"
            columns: ["decision_maker_id"]
            isOneToOne: false
            referencedRelation: "decision_makers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          metadata: Json | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analysis_artifacts: {
        Row: {
          api_call_cost: number | null
          artifact_type: string
          company_id: string
          confidence_score: number | null
          created_at: string
          data_checksum: string | null
          error_details: string | null
          execution_time_ms: number | null
          fields_count: number | null
          id: string
          normalized_data: Json | null
          raw_data: Json
          run_id: string
          source_name: string
          status: string
        }
        Insert: {
          api_call_cost?: number | null
          artifact_type: string
          company_id: string
          confidence_score?: number | null
          created_at?: string
          data_checksum?: string | null
          error_details?: string | null
          execution_time_ms?: number | null
          fields_count?: number | null
          id?: string
          normalized_data?: Json | null
          raw_data: Json
          run_id: string
          source_name: string
          status: string
        }
        Update: {
          api_call_cost?: number | null
          artifact_type?: string
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          data_checksum?: string | null
          error_details?: string | null
          execution_time_ms?: number | null
          fields_count?: number | null
          id?: string
          normalized_data?: Json | null
          raw_data?: Json
          run_id?: string
          source_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_artifacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_artifacts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_runs: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          data_quality_score: number | null
          duration_ms: number | null
          error_log: Json | null
          fields_enriched: number | null
          fields_total: number | null
          id: string
          metadata: Json | null
          run_type: string
          sources_attempted: Json | null
          sources_failed: Json | null
          sources_succeeded: Json | null
          started_at: string
          status: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          data_quality_score?: number | null
          duration_ms?: number | null
          error_log?: Json | null
          fields_enriched?: number | null
          fields_total?: number | null
          id?: string
          metadata?: Json | null
          run_type: string
          sources_attempted?: Json | null
          sources_failed?: Json | null
          sources_succeeded?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          data_quality_score?: number | null
          duration_ms?: number | null
          error_log?: Json | null
          fields_enriched?: number | null
          fields_total?: number | null
          id?: string
          metadata?: Json | null
          run_type?: string
          sources_attempted?: Json | null
          sources_failed?: Json | null
          sources_succeeded?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_features: {
        Row: {
          enabled: boolean
          feature: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          feature: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          feature?: string
          updated_at?: string
        }
        Relationships: []
      }
      battle_cards: {
        Row: {
          competitor_id: string
          created_at: string | null
          feature_comparison: Json
          id: string
          objection_handling: Json | null
          pricing_comparison: Json
          proof_points: Json | null
          totvs_product_sku: string
          updated_at: string | null
          win_stories: Json | null
          win_strategy: string | null
        }
        Insert: {
          competitor_id: string
          created_at?: string | null
          feature_comparison?: Json
          id?: string
          objection_handling?: Json | null
          pricing_comparison?: Json
          proof_points?: Json | null
          totvs_product_sku: string
          updated_at?: string | null
          win_stories?: Json | null
          win_strategy?: string | null
        }
        Update: {
          competitor_id?: string
          created_at?: string | null
          feature_comparison?: Json
          id?: string
          objection_handling?: Json | null
          pricing_comparison?: Json
          proof_points?: Json | null
          totvs_product_sku?: string
          updated_at?: string | null
          win_stories?: Json | null
          win_strategy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_cards_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      bitrix_sync_config: {
        Row: {
          auto_sync: boolean | null
          created_at: string | null
          domain: string | null
          field_mapping: Json | null
          id: string
          last_sync: string | null
          status: string | null
          sync_direction: string
          sync_interval_minutes: number | null
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          auto_sync?: boolean | null
          created_at?: string | null
          domain?: string | null
          field_mapping?: Json | null
          id?: string
          last_sync?: string | null
          status?: string | null
          sync_direction: string
          sync_interval_minutes?: number | null
          updated_at?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          auto_sync?: boolean | null
          created_at?: string | null
          domain?: string | null
          field_mapping?: Json | null
          id?: string
          last_sync?: string | null
          status?: string | null
          sync_direction?: string
          sync_interval_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      bitrix_sync_log: {
        Row: {
          config_id: string
          created_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          status: string
          sync_direction: string
        }
        Insert: {
          config_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status: string
          sync_direction: string
        }
        Update: {
          config_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_direction?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_sync_log_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "bitrix_sync_config"
            referencedColumns: ["id"]
          },
        ]
      }
      business_cases: {
        Row: {
          accepted_at: string | null
          account_strategy_id: string | null
          business_impact: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          current_situation: string | null
          expected_benefits: Json | null
          id: string
          identified_problems: Json | null
          implementation_phases: Json | null
          investment_breakdown: Json | null
          payment_terms: string | null
          presentation_url: string | null
          products_included: Json | null
          proposal_url: string | null
          proposed_solution: string | null
          risk_mitigation: Json | null
          roi_calculation: Json | null
          sent_at: string | null
          similar_cases: Json | null
          status: string | null
          success_metrics: Json | null
          testimonials: Json | null
          updated_at: string | null
          version: number | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          account_strategy_id?: string | null
          business_impact?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_situation?: string | null
          expected_benefits?: Json | null
          id?: string
          identified_problems?: Json | null
          implementation_phases?: Json | null
          investment_breakdown?: Json | null
          payment_terms?: string | null
          presentation_url?: string | null
          products_included?: Json | null
          proposal_url?: string | null
          proposed_solution?: string | null
          risk_mitigation?: Json | null
          roi_calculation?: Json | null
          sent_at?: string | null
          similar_cases?: Json | null
          status?: string | null
          success_metrics?: Json | null
          testimonials?: Json | null
          updated_at?: string | null
          version?: number | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          account_strategy_id?: string | null
          business_impact?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_situation?: string | null
          expected_benefits?: Json | null
          id?: string
          identified_problems?: Json | null
          implementation_phases?: Json | null
          investment_breakdown?: Json | null
          payment_terms?: string | null
          presentation_url?: string | null
          products_included?: Json | null
          proposal_url?: string | null
          proposed_solution?: string | null
          risk_mitigation?: Json | null
          roi_calculation?: Json | null
          sent_at?: string | null
          similar_cases?: Json | null
          status?: string | null
          success_metrics?: Json | null
          testimonials?: Json | null
          updated_at?: string | null
          version?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_cases_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_personas: {
        Row: {
          best_approach: string | null
          communication_style: string | null
          content_preferences: string[] | null
          created_at: string | null
          custom_data: Json | null
          decision_factors: Json | null
          department: string | null
          id: string
          is_default: boolean | null
          key_messages: Json | null
          meeting_style: string | null
          motivators: Json | null
          name: string
          objections: Json | null
          pain_points: Json | null
          preferred_channels: Json | null
          role: string
          seniority: string
          updated_at: string | null
        }
        Insert: {
          best_approach?: string | null
          communication_style?: string | null
          content_preferences?: string[] | null
          created_at?: string | null
          custom_data?: Json | null
          decision_factors?: Json | null
          department?: string | null
          id?: string
          is_default?: boolean | null
          key_messages?: Json | null
          meeting_style?: string | null
          motivators?: Json | null
          name: string
          objections?: Json | null
          pain_points?: Json | null
          preferred_channels?: Json | null
          role: string
          seniority: string
          updated_at?: string | null
        }
        Update: {
          best_approach?: string | null
          communication_style?: string | null
          content_preferences?: string[] | null
          created_at?: string | null
          custom_data?: Json | null
          decision_factors?: Json | null
          department?: string | null
          id?: string
          is_default?: boolean | null
          key_messages?: Json | null
          meeting_style?: string | null
          motivators?: Json | null
          name?: string
          objections?: Json | null
          pain_points?: Json | null
          preferred_channels?: Json | null
          role?: string
          seniority?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      call_recordings: {
        Row: {
          call_sid: string
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          recording_sid: string | null
          recording_url: string | null
          status: string | null
          transcription: string | null
          transcription_sid: string | null
          updated_at: string | null
        }
        Insert: {
          call_sid: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          recording_sid?: string | null
          recording_url?: string | null
          status?: string | null
          transcription?: string | null
          transcription_sid?: string | null
          updated_at?: string | null
        }
        Update: {
          call_sid?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          recording_sid?: string | null
          recording_url?: string | null
          status?: string | null
          transcription?: string | null
          transcription_sid?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_recordings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_recordings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
          owners: string[] | null
          purpose: string | null
          status: string | null
          tags: string[] | null
          template: string | null
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
          owners?: string[] | null
          purpose?: string | null
          status?: string | null
          tags?: string[] | null
          template?: string | null
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
          owners?: string[] | null
          purpose?: string | null
          status?: string | null
          tags?: string[] | null
          template?: string | null
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
      canvas_activity: {
        Row: {
          action_type: string
          block_id: string | null
          canvas_id: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          block_id?: string | null
          canvas_id: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          block_id?: string | null
          canvas_id?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_activity_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "canvas_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_activity_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvas"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_blocks: {
        Row: {
          canvas_id: string
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          order_index: number
          type: string
          updated_at: string | null
        }
        Insert: {
          canvas_id: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_index?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          canvas_id?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_index?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_blocks_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvas"
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
      canvas_links: {
        Row: {
          canvas_id: string
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          canvas_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          canvas_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_links_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvas"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_permissions: {
        Row: {
          canvas_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          canvas_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          canvas_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_permissions_canvas_id_fkey"
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
          cnpj_status: string | null
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
          cnpj_status?: string | null
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
          cnpj_status?: string | null
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
      company_enrichment: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          id: string
          source: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data: Json
          id?: string
          source: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_enrichment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_previews: {
        Row: {
          cnpj: string | null
          created_at: string
          domain: string | null
          id: string
          name: string | null
          query: string | null
          snapshot: Json
          updated_at: string
          website: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          name?: string | null
          query?: string | null
          snapshot?: Json
          updated_at?: string
          website?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          name?: string | null
          query?: string | null
          snapshot?: Json
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_snapshots: {
        Row: {
          company_data: Json
          company_id: string
          data_freshness_score: number | null
          data_hash: string
          days_since_last_update: number | null
          decision_makers_data: Json | null
          digital_presence_data: Json | null
          governance_signals_data: Json | null
          id: string
          run_id: string
          snapshot_date: string
        }
        Insert: {
          company_data: Json
          company_id: string
          data_freshness_score?: number | null
          data_hash: string
          days_since_last_update?: number | null
          decision_makers_data?: Json | null
          digital_presence_data?: Json | null
          governance_signals_data?: Json | null
          id?: string
          run_id: string
          snapshot_date?: string
        }
        Update: {
          company_data?: Json
          company_id?: string
          data_freshness_score?: number | null
          data_hash?: string
          days_since_last_update?: number | null
          decision_makers_data?: Json | null
          digital_presence_data?: Json | null
          governance_signals_data?: Json | null
          id?: string
          run_id?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_snapshots_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          active: boolean | null
          avg_deal_size: number | null
          catalog_url: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          market_position: string | null
          name: string
          pricing_model: string | null
          strengths: Json | null
          target_market: string[] | null
          totvs_advantages: Json | null
          updated_at: string | null
          weaknesses: Json | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          active?: boolean | null
          avg_deal_size?: number | null
          catalog_url?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          market_position?: string | null
          name: string
          pricing_model?: string | null
          strengths?: Json | null
          target_market?: string[] | null
          totvs_advantages?: Json | null
          updated_at?: string | null
          weaknesses?: Json | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          active?: boolean | null
          avg_deal_size?: number | null
          catalog_url?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          market_position?: string | null
          name?: string
          pricing_model?: string | null
          strengths?: Json | null
          target_market?: string[] | null
          totvs_advantages?: Json | null
          updated_at?: string | null
          weaknesses?: Json | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      consultant_rates: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          experience_years_max: number | null
          experience_years_min: number | null
          hourly_rate_max: number
          hourly_rate_min: number
          id: string
          level: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          hourly_rate_max: number
          hourly_rate_min: number
          id?: string
          level: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          hourly_rate_max?: number
          hourly_rate_min?: number
          id?: string
          level?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consulting_services: {
        Row: {
          active: boolean | null
          base_hourly_rate: number | null
          base_project_price: number | null
          category: string
          complexity_factors: Json | null
          consultant_level: string | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          estimated_hours_max: number | null
          estimated_hours_min: number | null
          id: string
          implementation_cost: number | null
          is_configurable: boolean | null
          max_hourly_rate: number | null
          max_project_price: number | null
          min_hourly_rate: number | null
          min_project_price: number | null
          name: string
          pricing_models: Json | null
          recommended_with: string[] | null
          requires_platforms: Json | null
          sku: string
          target_sectors: Json | null
          training_cost: number | null
          travel_daily_rate: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_hourly_rate?: number | null
          base_project_price?: number | null
          category: string
          complexity_factors?: Json | null
          consultant_level?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          estimated_hours_max?: number | null
          estimated_hours_min?: number | null
          id?: string
          implementation_cost?: number | null
          is_configurable?: boolean | null
          max_hourly_rate?: number | null
          max_project_price?: number | null
          min_hourly_rate?: number | null
          min_project_price?: number | null
          name: string
          pricing_models?: Json | null
          recommended_with?: string[] | null
          requires_platforms?: Json | null
          sku: string
          target_sectors?: Json | null
          training_cost?: number | null
          travel_daily_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_hourly_rate?: number | null
          base_project_price?: number | null
          category?: string
          complexity_factors?: Json | null
          consultant_level?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          estimated_hours_max?: number | null
          estimated_hours_min?: number | null
          id?: string
          implementation_cost?: number | null
          is_configurable?: boolean | null
          max_hourly_rate?: number | null
          max_project_price?: number | null
          min_hourly_rate?: number | null
          min_project_price?: number | null
          name?: string
          pricing_models?: Json | null
          recommended_with?: string[] | null
          requires_platforms?: Json | null
          sku?: string
          target_sectors?: Json | null
          training_cost?: number | null
          travel_daily_rate?: number | null
          updated_at?: string | null
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
      customer_onboarding: {
        Row: {
          assigned_csm: string | null
          company_id: string
          created_at: string | null
          deal_id: string
          go_live_date: string | null
          id: string
          implementation_plan: Json | null
          kickoff_date: string | null
          milestones: Json | null
          notes: string | null
          onboarding_status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_csm?: string | null
          company_id: string
          created_at?: string | null
          deal_id: string
          go_live_date?: string | null
          id?: string
          implementation_plan?: Json | null
          kickoff_date?: string | null
          milestones?: Json | null
          notes?: string | null
          onboarding_status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_csm?: string | null
          company_id?: string
          created_at?: string | null
          deal_id?: string
          go_live_date?: string | null
          id?: string
          implementation_plan?: Json | null
          kickoff_date?: string | null
          milestones?: Json | null
          notes?: string | null
          onboarding_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_onboarding_assigned_csm_fkey"
            columns: ["assigned_csm"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_onboarding_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "sdr_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_approvals: {
        Row: {
          approval_level: string | null
          approved_by: string | null
          created_at: string | null
          deal_id: string
          discount_requested: number
          id: string
          justification: string | null
          quote_id: string | null
          requested_by: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          approval_level?: string | null
          approved_by?: string | null
          created_at?: string | null
          deal_id: string
          discount_requested: number
          id?: string
          justification?: string | null
          quote_id?: string | null
          requested_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          approval_level?: string | null
          approved_by?: string | null
          created_at?: string | null
          deal_id?: string
          discount_requested?: number
          id?: string
          justification?: string | null
          quote_id?: string | null
          requested_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "sdr_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
          web_score?: number | null
          website_metrics?: Json | null
          youtube_data?: Json | null
        }
        Relationships: []
      }
      executive_reports: {
        Row: {
          company_id: string
          content: Json
          data_quality_score: number | null
          generated_at: string
          id: string
          report_type: string
          run_id: string | null
          sources_used: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          content: Json
          data_quality_score?: number | null
          generated_at?: string
          id?: string
          report_type: string
          run_id?: string | null
          sources_used?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: Json
          data_quality_score?: number | null
          generated_at?: string
          id?: string
          report_type?: string
          run_id?: string | null
          sources_used?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_reports_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_reports_versions: {
        Row: {
          change_summary: string | null
          company_id: string
          content: Json
          created_at: string
          created_by: string | null
          fields_changed: Json | null
          id: string
          quality_improvement: number | null
          report_id: string
          report_type: string
          run_id: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          company_id: string
          content: Json
          created_at?: string
          created_by?: string | null
          fields_changed?: Json | null
          id?: string
          quality_improvement?: number | null
          report_id: string
          report_type: string
          run_id?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          company_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          fields_changed?: Json | null
          id?: string
          quality_improvement?: number | null
          report_id?: string
          report_type?: string
          run_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "executive_reports_versions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_reports_versions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "executive_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_reports_versions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
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
      google_sheets_sync_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          sheet_url: string
          sync_frequency_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          sheet_url: string
          sync_frequency_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          sheet_url?: string
          sync_frequency_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      governance_signals: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          detected_at: string
          gap_category: string | null
          governance_gap_score: number | null
          id: string
          organizational_maturity_level: string | null
          raw_data: Json | null
          requires_consulting: boolean | null
          signal_type: string
          source: string | null
          transformation_priority: string | null
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          gap_category?: string | null
          governance_gap_score?: number | null
          id?: string
          organizational_maturity_level?: string | null
          raw_data?: Json | null
          requires_consulting?: boolean | null
          signal_type: string
          source?: string | null
          transformation_priority?: string | null
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          gap_category?: string | null
          governance_gap_score?: number | null
          id?: string
          organizational_maturity_level?: string | null
          raw_data?: Json | null
          requires_consulting?: boolean | null
          signal_type?: string
          source?: string | null
          transformation_priority?: string | null
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
      integration_configs: {
        Row: {
          channel: string
          config: Json
          created_at: string | null
          credentials: Json
          health_status: Json | null
          id: string
          last_health_check: string | null
          provider: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          config?: Json
          created_at?: string | null
          credentials?: Json
          health_status?: Json | null
          id?: string
          last_health_check?: string | null
          provider: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          config?: Json
          created_at?: string | null
          credentials?: Json
          health_status?: Json | null
          id?: string
          last_health_check?: string | null
          provider?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
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
      message_templates: {
        Row: {
          body: string
          category: string
          channel: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          category: string
          channel: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string | null
          variables?: Json | null
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
          metadata: Json | null
          provider_message_id: string | null
          raw: Json | null
          status: string | null
          to_id: string | null
          webhook_id: string | null
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
          metadata?: Json | null
          provider_message_id?: string | null
          raw?: Json | null
          status?: string | null
          to_id?: string | null
          webhook_id?: string | null
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
          metadata?: Json | null
          provider_message_id?: string | null
          raw?: Json | null
          status?: string | null
          to_id?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_logs"
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
      pricing_rules: {
        Row: {
          active: boolean | null
          conditions: Json
          created_at: string | null
          discount_percentage: number | null
          id: string
          name: string
          price_multiplier: number | null
          priority: number | null
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          conditions: Json
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          name: string
          price_multiplier?: number | null
          priority?: number | null
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          conditions?: Json
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          name?: string
          price_multiplier?: number | null
          priority?: number | null
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          active: boolean | null
          base_price: number
          category: string
          config_options: Json | null
          cost: number | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          id: string
          is_configurable: boolean | null
          max_quantity: number | null
          metadata: Json | null
          min_price: number | null
          min_quantity: number | null
          name: string
          recommended_with: string[] | null
          sku: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_price: number
          category: string
          config_options?: Json | null
          cost?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_configurable?: boolean | null
          max_quantity?: number | null
          metadata?: Json | null
          min_price?: number | null
          min_quantity?: number | null
          name: string
          recommended_with?: string[] | null
          sku: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_price?: number
          category?: string
          config_options?: Json | null
          cost?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_configurable?: boolean | null
          max_quantity?: number | null
          metadata?: Json | null
          min_price?: number | null
          min_quantity?: number | null
          name?: string
          recommended_with?: string[] | null
          sku?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          facebook_url: string | null
          full_name: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone: string | null
          telegram_username: string | null
          twitter_url: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          facebook_url?: string | null
          full_name?: string | null
          id: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          telegram_username?: string | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          telegram_username?: string | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      quote_history: {
        Row: {
          accepted_at: string | null
          account_strategy_id: string | null
          applied_rules: Json | null
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          competitive_position: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          metadata: Json | null
          negotiation_history: Json | null
          products: Json
          quote_number: string
          rejected_at: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          sent_at: string | null
          status: string | null
          suggested_price: number | null
          total_discounts: number | null
          total_final_price: number
          total_list_price: number | null
          updated_at: string | null
          valid_until: string | null
          viewed_at: string | null
          win_probability: number | null
        }
        Insert: {
          accepted_at?: string | null
          account_strategy_id?: string | null
          applied_rules?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          competitive_position?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          negotiation_history?: Json | null
          products?: Json
          quote_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          sent_at?: string | null
          status?: string | null
          suggested_price?: number | null
          total_discounts?: number | null
          total_final_price: number
          total_list_price?: number | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          win_probability?: number | null
        }
        Update: {
          accepted_at?: string | null
          account_strategy_id?: string | null
          applied_rules?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          competitive_position?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          negotiation_history?: Json | null
          products?: Json
          quote_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          sent_at?: string | null
          status?: string | null
          suggested_price?: number | null
          total_discounts?: number | null
          total_final_price?: number
          total_list_price?: number | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_history_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "sdr_deals"
            referencedColumns: ["id"]
          },
        ]
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
      sales_goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          period_type: string
          product_targets: Json | null
          progress_percentage: number | null
          proposals_achieved: number
          proposals_target: number
          revenue_achieved: number
          revenue_target: number
          sales_achieved: number
          sales_target: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          period_type: string
          product_targets?: Json | null
          progress_percentage?: number | null
          proposals_achieved?: number
          proposals_target?: number
          revenue_achieved?: number
          revenue_target?: number
          sales_achieved?: number
          sales_target?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          product_targets?: Json | null
          progress_percentage?: number | null
          proposals_achieved?: number
          proposals_target?: number
          revenue_achieved?: number
          revenue_target?: number
          sales_achieved?: number
          sales_target?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scenario_analysis: {
        Row: {
          account_strategy_id: string | null
          assumptions: Json | null
          best_case: Json
          company_id: string
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          expected_case: Json
          id: string
          key_insights: Json | null
          probability_best: number | null
          probability_expected: number | null
          probability_worst: number | null
          quote_id: string | null
          recommended_scenario: string | null
          risk_factors: Json | null
          sensitivity_analysis: Json | null
          updated_at: string | null
          worst_case: Json
        }
        Insert: {
          account_strategy_id?: string | null
          assumptions?: Json | null
          best_case?: Json
          company_id: string
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_case?: Json
          id?: string
          key_insights?: Json | null
          probability_best?: number | null
          probability_expected?: number | null
          probability_worst?: number | null
          quote_id?: string | null
          recommended_scenario?: string | null
          risk_factors?: Json | null
          sensitivity_analysis?: Json | null
          updated_at?: string | null
          worst_case?: Json
        }
        Update: {
          account_strategy_id?: string | null
          assumptions?: Json | null
          best_case?: Json
          company_id?: string
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_case?: Json
          id?: string
          key_insights?: Json | null
          probability_best?: number | null
          probability_expected?: number | null
          probability_worst?: number | null
          quote_id?: string | null
          recommended_scenario?: string | null
          risk_factors?: Json | null
          sensitivity_analysis?: Json | null
          updated_at?: string | null
          worst_case?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scenario_analysis_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_analysis_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_history"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_used_at?: string | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
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
      sdr_deal_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          created_by: string | null
          deal_id: string
          description: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          created_by?: string | null
          deal_id: string
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "sdr_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_deals: {
        Row: {
          assigned_sales_rep: string | null
          assigned_to: string | null
          bitrix24_data: Json | null
          bitrix24_synced_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expected_close_date: string | null
          external_id: string | null
          id: string
          last_activity_at: string | null
          lost_reason: string | null
          pipeline_id: string | null
          priority: string | null
          probability: number | null
          proposal_id: string | null
          quote_id: string | null
          source: string | null
          stage: string
          stage_order: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          value: number | null
          won_date: string | null
        }
        Insert: {
          assigned_sales_rep?: string | null
          assigned_to?: string | null
          bitrix24_data?: Json | null
          bitrix24_synced_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          external_id?: string | null
          id?: string
          last_activity_at?: string | null
          lost_reason?: string | null
          pipeline_id?: string | null
          priority?: string | null
          probability?: number | null
          proposal_id?: string | null
          quote_id?: string | null
          source?: string | null
          stage?: string
          stage_order?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          value?: number | null
          won_date?: string | null
        }
        Update: {
          assigned_sales_rep?: string | null
          assigned_to?: string | null
          bitrix24_data?: Json | null
          bitrix24_synced_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          external_id?: string | null
          id?: string
          last_activity_at?: string | null
          lost_reason?: string | null
          pipeline_id?: string | null
          priority?: string | null
          probability?: number | null
          proposal_id?: string | null
          quote_id?: string | null
          source?: string | null
          stage?: string
          stage_order?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          value?: number | null
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_deals_assigned_sales_rep_fkey"
            columns: ["assigned_sales_rep"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_deals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "visual_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_deals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_history"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_diagnostics: {
        Row: {
          ai_insights: string | null
          company_id: string | null
          competitive_analysis: Json | null
          created_at: string | null
          diagnostic_file_path: string
          diagnostic_summary: Json | null
          gaps_identified: Json | null
          id: string
          recommended_products: Json | null
          sdr_user_id: string | null
          technologies_found: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_insights?: string | null
          company_id?: string | null
          competitive_analysis?: Json | null
          created_at?: string | null
          diagnostic_file_path: string
          diagnostic_summary?: Json | null
          gaps_identified?: Json | null
          id?: string
          recommended_products?: Json | null
          sdr_user_id?: string | null
          technologies_found?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_insights?: string | null
          company_id?: string | null
          competitive_analysis?: Json | null
          created_at?: string | null
          diagnostic_file_path?: string
          diagnostic_summary?: Json | null
          gaps_identified?: Json | null
          id?: string
          recommended_products?: Json | null
          sdr_user_id?: string | null
          technologies_found?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_diagnostics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_handoffs: {
        Row: {
          accepted_at: string | null
          checklist: Json | null
          created_at: string | null
          deal_id: string
          from_sdr: string | null
          handoff_date: string | null
          handoff_notes: string | null
          id: string
          status: string | null
          to_sales_rep: string
        }
        Insert: {
          accepted_at?: string | null
          checklist?: Json | null
          created_at?: string | null
          deal_id: string
          from_sdr?: string | null
          handoff_date?: string | null
          handoff_notes?: string | null
          id?: string
          status?: string | null
          to_sales_rep: string
        }
        Update: {
          accepted_at?: string | null
          checklist?: Json | null
          created_at?: string | null
          deal_id?: string
          from_sdr?: string | null
          handoff_date?: string | null
          handoff_notes?: string | null
          id?: string
          status?: string | null
          to_sales_rep?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_handoffs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "sdr_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_handoffs_from_sdr_fkey"
            columns: ["from_sdr"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_handoffs_to_sales_rep_fkey"
            columns: ["to_sales_rep"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_integrations: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          integration_name: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          integration_name: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          integration_name?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sdr_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sdr_opportunities: {
        Row: {
          assigned_to: string | null
          canvas_id: string | null
          company_id: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          metadata: Json | null
          next_action: string | null
          next_action_date: string | null
          probability: number
          stage: string
          title: string
          updated_at: string | null
          value: number
          won_date: string | null
        }
        Insert: {
          assigned_to?: string | null
          canvas_id?: string | null
          company_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json | null
          next_action?: string | null
          next_action_date?: string | null
          probability?: number
          stage: string
          title: string
          updated_at?: string | null
          value?: number
          won_date?: string | null
        }
        Update: {
          assigned_to?: string | null
          canvas_id?: string | null
          company_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json | null
          next_action?: string | null
          next_action_date?: string | null
          probability?: number
          stage?: string
          title?: string
          updated_at?: string | null
          value?: number
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_opportunities_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_opportunities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_pipeline_stages: {
        Row: {
          automation_rules: Json | null
          color: string | null
          created_at: string | null
          id: string
          is_closed: boolean | null
          is_won: boolean | null
          key: string
          name: string
          order_index: number
          probability_default: number | null
          updated_at: string | null
        }
        Insert: {
          automation_rules?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_closed?: boolean | null
          is_won?: boolean | null
          key: string
          name: string
          order_index: number
          probability_default?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_rules?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_closed?: boolean | null
          is_won?: boolean | null
          key?: string
          name?: string
          order_index?: number
          probability_default?: number | null
          updated_at?: string | null
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
      sdr_webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "sdr_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_webhooks: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          secret: string | null
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          secret?: string | null
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          secret?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
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
      totvs_products: {
        Row: {
          active: boolean | null
          base_price: number
          category: string
          config_options: Json | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          id: string
          is_configurable: boolean | null
          max_employees: number | null
          max_price: number | null
          max_quantity: number | null
          min_employees: number | null
          min_price: number
          min_quantity: number | null
          name: string
          recommended_with: string[] | null
          sku: string
          submodules: Json | null
          target_company_size: string[] | null
          target_sectors: Json | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_price: number
          category: string
          config_options?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_configurable?: boolean | null
          max_employees?: number | null
          max_price?: number | null
          max_quantity?: number | null
          min_employees?: number | null
          min_price: number
          min_quantity?: number | null
          name: string
          recommended_with?: string[] | null
          sku: string
          submodules?: Json | null
          target_company_size?: string[] | null
          target_sectors?: Json | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_price?: number
          category?: string
          config_options?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_configurable?: boolean | null
          max_employees?: number | null
          max_price?: number | null
          max_quantity?: number | null
          min_employees?: number | null
          min_price?: number
          min_quantity?: number | null
          name?: string
          recommended_with?: string[] | null
          sku?: string
          submodules?: Json | null
          target_company_size?: string[] | null
          target_sectors?: Json | null
          updated_at?: string | null
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
      value_milestones: {
        Row: {
          actual_value: number | null
          blockers: Json | null
          completed_date: string | null
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          expected_value: number | null
          id: string
          milestone_name: string
          notes: string | null
          owner_id: string | null
          status: string | null
          target_date: string
          updated_at: string | null
          value_tracking_id: string
        }
        Insert: {
          actual_value?: number | null
          blockers?: Json | null
          completed_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          expected_value?: number | null
          id?: string
          milestone_name: string
          notes?: string | null
          owner_id?: string | null
          status?: string | null
          target_date: string
          updated_at?: string | null
          value_tracking_id: string
        }
        Update: {
          actual_value?: number | null
          blockers?: Json | null
          completed_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          expected_value?: number | null
          id?: string
          milestone_name?: string
          notes?: string | null
          owner_id?: string | null
          status?: string | null
          target_date?: string
          updated_at?: string | null
          value_tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "value_milestones_value_tracking_id_fkey"
            columns: ["value_tracking_id"]
            isOneToOne: false
            referencedRelation: "value_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      value_tracking: {
        Row: {
          account_strategy_id: string | null
          baseline_date: string
          company_id: string
          created_at: string | null
          created_by: string | null
          health_score: number | null
          id: string
          last_measured_at: string | null
          milestones: Json | null
          next_review_date: string | null
          promised_annual_savings: number
          promised_efficiency_gain: number | null
          promised_payback_months: number
          promised_revenue_growth: number | null
          promised_roi: number
          realized_annual_savings: number | null
          realized_efficiency_gain: number | null
          realized_payback_months: number | null
          realized_revenue_growth: number | null
          realized_roi: number | null
          review_frequency: string | null
          risk_flags: Json | null
          tracking_status: string | null
          updated_at: string | null
          variance_analysis: Json | null
        }
        Insert: {
          account_strategy_id?: string | null
          baseline_date?: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          health_score?: number | null
          id?: string
          last_measured_at?: string | null
          milestones?: Json | null
          next_review_date?: string | null
          promised_annual_savings: number
          promised_efficiency_gain?: number | null
          promised_payback_months: number
          promised_revenue_growth?: number | null
          promised_roi: number
          realized_annual_savings?: number | null
          realized_efficiency_gain?: number | null
          realized_payback_months?: number | null
          realized_revenue_growth?: number | null
          realized_roi?: number | null
          review_frequency?: string | null
          risk_flags?: Json | null
          tracking_status?: string | null
          updated_at?: string | null
          variance_analysis?: Json | null
        }
        Update: {
          account_strategy_id?: string | null
          baseline_date?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          health_score?: number | null
          id?: string
          last_measured_at?: string | null
          milestones?: Json | null
          next_review_date?: string | null
          promised_annual_savings?: number
          promised_efficiency_gain?: number | null
          promised_payback_months?: number
          promised_revenue_growth?: number | null
          promised_roi?: number
          realized_annual_savings?: number | null
          realized_efficiency_gain?: number | null
          realized_payback_months?: number | null
          realized_revenue_growth?: number | null
          realized_roi?: number | null
          review_frequency?: string | null
          risk_flags?: Json | null
          tracking_status?: string | null
          updated_at?: string | null
          variance_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "value_tracking_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "value_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_proposals: {
        Row: {
          account_strategy_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          logo_url: string | null
          metadata: Json | null
          pdf_url: string | null
          presentation_url: string | null
          primary_color: string | null
          proposal_number: string
          quote_id: string | null
          requires_signature: boolean | null
          scenario_id: string | null
          secondary_color: string | null
          sections: Json
          sent_at: string | null
          signature_ip: string | null
          signed_at: string | null
          signed_by_email: string | null
          signed_by_name: string | null
          status: string | null
          template_id: string | null
          time_spent_seconds: number | null
          title: string
          updated_at: string | null
          valid_until: string | null
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          account_strategy_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          presentation_url?: string | null
          primary_color?: string | null
          proposal_number: string
          quote_id?: string | null
          requires_signature?: boolean | null
          scenario_id?: string | null
          secondary_color?: string | null
          sections?: Json
          sent_at?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string | null
          template_id?: string | null
          time_spent_seconds?: number | null
          title: string
          updated_at?: string | null
          valid_until?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          account_strategy_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          presentation_url?: string | null
          primary_color?: string | null
          proposal_number?: string
          quote_id?: string | null
          requires_signature?: boolean | null
          scenario_id?: string | null
          secondary_color?: string | null
          sections?: Json
          sent_at?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string | null
          template_id?: string | null
          time_spent_seconds?: number | null
          title?: string
          updated_at?: string | null
          valid_until?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_proposals_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_proposals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_proposals_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          channel: string
          created_at: string | null
          error: string | null
          headers: Json | null
          id: string
          payload: Json
          processed: boolean | null
          provider: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          error?: string | null
          headers?: Json | null
          id?: string
          payload: Json
          processed?: boolean | null
          provider: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          error?: string | null
          headers?: Json | null
          id?: string
          payload?: Json
          processed?: boolean | null
          provider?: string
        }
        Relationships: []
      }
      win_loss_analysis: {
        Row: {
          account_strategy_id: string | null
          action_items: Json | null
          closed_at: string | null
          company_id: string
          competitive_intensity: string | null
          competitors_faced: string[] | null
          created_at: string | null
          created_by: string | null
          customer_feedback: string | null
          deal_stage_lost: string | null
          deal_value: number | null
          id: string
          internal_notes: string | null
          key_differentiators: Json | null
          lessons_learned: Json | null
          loss_reasons: Json | null
          outcome: string
          primary_competitor: string | null
          quote_id: string | null
          updated_at: string | null
          win_reasons: Json | null
        }
        Insert: {
          account_strategy_id?: string | null
          action_items?: Json | null
          closed_at?: string | null
          company_id: string
          competitive_intensity?: string | null
          competitors_faced?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_feedback?: string | null
          deal_stage_lost?: string | null
          deal_value?: number | null
          id?: string
          internal_notes?: string | null
          key_differentiators?: Json | null
          lessons_learned?: Json | null
          loss_reasons?: Json | null
          outcome: string
          primary_competitor?: string | null
          quote_id?: string | null
          updated_at?: string | null
          win_reasons?: Json | null
        }
        Update: {
          account_strategy_id?: string | null
          action_items?: Json | null
          closed_at?: string | null
          company_id?: string
          competitive_intensity?: string | null
          competitors_faced?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_feedback?: string | null
          deal_stage_lost?: string | null
          deal_value?: number | null
          id?: string
          internal_notes?: string | null
          key_differentiators?: Json | null
          lessons_learned?: Json | null
          loss_reasons?: Json | null
          outcome?: string
          primary_competitor?: string | null
          quote_id?: string | null
          updated_at?: string | null
          win_reasons?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "win_loss_analysis_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "win_loss_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "win_loss_analysis_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_history"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_canvas_version: {
        Args: { p_canvas_id: string; p_description?: string; p_tag?: string }
        Returns: string
      }
      get_next_report_version: {
        Args: { p_company_id: string; p_report_type: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_canvas_decision: {
        Args: { p_block_id: string; p_target_type: string }
        Returns: string
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
