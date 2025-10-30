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
            foreignKeyName: "account_strategies_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "buyer_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      account_strategy_modules: {
        Row: {
          account_strategy_id: string | null
          company_id: string | null
          created_at: string
          data: Json
          id: string
          is_draft: boolean
          module: string
          title: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          account_strategy_id?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_draft?: boolean
          module: string
          title?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          account_strategy_id?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_draft?: boolean
          module?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_strategy_modules_account_strategy_id_fkey"
            columns: ["account_strategy_id"]
            isOneToOne: false
            referencedRelation: "account_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_strategy_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      apollo_credit_config: {
        Row: {
          alert_threshold: number
          block_threshold: number
          id: string
          plan_type: string
          reset_date: string
          total_credits: number
          trial_ends_at: string
          updated_at: string
          used_credits: number
        }
        Insert: {
          alert_threshold?: number
          block_threshold?: number
          id?: string
          plan_type?: string
          reset_date?: string
          total_credits?: number
          trial_ends_at?: string
          updated_at?: string
          used_credits?: number
        }
        Update: {
          alert_threshold?: number
          block_threshold?: number
          id?: string
          plan_type?: string
          reset_date?: string
          total_credits?: number
          trial_ends_at?: string
          updated_at?: string
          used_credits?: number
        }
        Relationships: []
      }
      apollo_credit_usage: {
        Row: {
          actual_credits: number | null
          company_id: string | null
          company_name: string | null
          completed_at: string | null
          error_code: string | null
          error_message: string | null
          estimated_credits: number
          id: string
          modes: string[]
          organization_id: string
          requested_at: string
          requested_by: string | null
          status: string
        }
        Insert: {
          actual_credits?: number | null
          company_id?: string | null
          company_name?: string | null
          completed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          estimated_credits: number
          id?: string
          modes: string[]
          organization_id: string
          requested_at?: string
          requested_by?: string | null
          status: string
        }
        Update: {
          actual_credits?: number | null
          company_id?: string | null
          company_name?: string | null
          completed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          estimated_credits?: number
          id?: string
          modes?: string[]
          organization_id?: string
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "apollo_credit_usage_company_id_fkey"
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
      br_mesoregions: {
        Row: {
          created_at: string
          id: string
          mesoregion_code: string
          mesoregion_name: string
          state_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          mesoregion_code: string
          mesoregion_name: string
          state_code: string
        }
        Update: {
          created_at?: string
          id?: string
          mesoregion_code?: string
          mesoregion_name?: string
          state_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "br_mesoregions_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "br_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      br_microregions: {
        Row: {
          created_at: string
          id: string
          mesoregion_code: string
          microregion_code: string
          microregion_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          mesoregion_code: string
          microregion_code: string
          microregion_name: string
        }
        Update: {
          created_at?: string
          id?: string
          mesoregion_code?: string
          microregion_code?: string
          microregion_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "br_microregions_mesoregion_code_fkey"
            columns: ["mesoregion_code"]
            isOneToOne: false
            referencedRelation: "br_mesoregions"
            referencedColumns: ["mesoregion_code"]
          },
        ]
      }
      br_municipalities: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          microregion_code: string | null
          municipality_code: string
          municipality_name: string
          population: number | null
          state_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          microregion_code?: string | null
          municipality_code: string
          municipality_name: string
          population?: number | null
          state_code: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          microregion_code?: string | null
          municipality_code?: string
          municipality_name?: string
          population?: number | null
          state_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "br_municipalities_microregion_code_fkey"
            columns: ["microregion_code"]
            isOneToOne: false
            referencedRelation: "br_microregions"
            referencedColumns: ["microregion_code"]
          },
          {
            foreignKeyName: "br_municipalities_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "br_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      br_states: {
        Row: {
          created_at: string
          id: string
          region: string
          state_code: string
          state_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          region: string
          state_code: string
          state_name: string
        }
        Update: {
          created_at?: string
          id?: string
          region?: string
          state_code?: string
          state_name?: string
        }
        Relationships: []
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
      buying_signals: {
        Row: {
          company_id: string
          confidence_score: number | null
          created_at: string
          detected_at: string
          id: string
          is_reviewed: boolean | null
          priority: string | null
          raw_data: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          signal_description: string | null
          signal_title: string
          signal_type: string
          source_type: string | null
          source_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          created_at?: string
          detected_at?: string
          id?: string
          is_reviewed?: boolean | null
          priority?: string | null
          raw_data?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          signal_description?: string | null
          signal_title: string
          signal_type: string
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          detected_at?: string
          id?: string
          is_reviewed?: boolean | null
          priority?: string | null
          raw_data?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          signal_description?: string | null
          signal_title?: string
          signal_type?: string
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buying_signals_company_id_fkey1"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          account_score: number | null
          apollo_id: string | null
          apollo_last_enriched_at: string | null
          apollo_metadata: Json | null
          apollo_organization_id: string | null
          apollo_score: Json | null
          apollo_signals: Json | null
          apollo_url: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_at: string | null
          assigned_to: string | null
          buying_intent_score: number | null
          buying_intent_signals: Json | null
          closed_at: string | null
          cnpj: string | null
          cnpj_status: string | null
          company_insights: Json | null
          competitor_won: string | null
          created_at: string
          days_in_stage: number | null
          deal_notes: string | null
          deal_probability: number | null
          deal_stage: string | null
          deal_value: number | null
          demo_scheduled_at: string | null
          digital_maturity_score: number | null
          discount_percentage: number | null
          disqualification_reason: string | null
          domain: string | null
          employee_count_from_apollo: number | null
          employee_count_range: string | null
          employee_trends: Json | null
          employees: number | null
          estimated_deal_value: number | null
          expected_close_date: string | null
          field_meta: Json | null
          first_contact_at: string | null
          founding_year: number | null
          funding_rounds: Json | null
          funding_total: number | null
          headquarters_city: string | null
          headquarters_country: string | null
          headquarters_state: string | null
          icp_score: number | null
          icp_score_breakdown: Json | null
          id: string
          industry: string | null
          investors: Json | null
          is_disqualified: boolean | null
          job_postings: Json | null
          job_postings_count: number | null
          journey_stage: string | null
          last_activity_at: string | null
          last_apollo_sync_at: string | null
          last_contact_at: string | null
          last_funding_round_amount: number | null
          last_funding_round_date: string | null
          lead_qualified_id: string | null
          lead_score: number | null
          lead_score_updated_at: string | null
          lead_source_id: string | null
          linkedin_company_id: string | null
          linkedin_url: string | null
          location: Json | null
          loss_details: string | null
          loss_reason: string | null
          market_segments: string[] | null
          meeting_scheduled_at: string | null
          naics_codes: string[] | null
          name: string
          news: Json | null
          next_action: string | null
          next_action_date: string | null
          next_action_owner: string | null
          next_follow_up_action: string | null
          next_follow_up_date: string | null
          payment_terms: string | null
          phone_numbers: string[] | null
          pipeline_status: string | null
          proposal_sent_at: string | null
          proposed_products: Json | null
          quarantine_id: string | null
          raw_data: Json | null
          revenue: string | null
          revenue_range: string | null
          revenue_range_from_apollo: string | null
          sic_codes: string[] | null
          similar_companies: Json | null
          social_urls: Json | null
          stage_changed_at: string | null
          sub_industry: string | null
          suggested_leads: Json | null
          technologies: string[] | null
          technologies_full: Json | null
          temperature: string | null
          total_calls: number | null
          total_emails: number | null
          total_meetings: number | null
          total_whatsapp: number | null
          totvs_detection_score: number | null
          totvs_detection_sources: Json | null
          totvs_last_checked_at: string | null
          updated_at: string
          website: string | null
          website_visitors: Json | null
          website_visitors_count: number | null
          website_visitors_data: Json | null
        }
        Insert: {
          account_score?: number | null
          apollo_id?: string | null
          apollo_last_enriched_at?: string | null
          apollo_metadata?: Json | null
          apollo_organization_id?: string | null
          apollo_score?: Json | null
          apollo_signals?: Json | null
          apollo_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          buying_intent_score?: number | null
          buying_intent_signals?: Json | null
          closed_at?: string | null
          cnpj?: string | null
          cnpj_status?: string | null
          company_insights?: Json | null
          competitor_won?: string | null
          created_at?: string
          days_in_stage?: number | null
          deal_notes?: string | null
          deal_probability?: number | null
          deal_stage?: string | null
          deal_value?: number | null
          demo_scheduled_at?: string | null
          digital_maturity_score?: number | null
          discount_percentage?: number | null
          disqualification_reason?: string | null
          domain?: string | null
          employee_count_from_apollo?: number | null
          employee_count_range?: string | null
          employee_trends?: Json | null
          employees?: number | null
          estimated_deal_value?: number | null
          expected_close_date?: string | null
          field_meta?: Json | null
          first_contact_at?: string | null
          founding_year?: number | null
          funding_rounds?: Json | null
          funding_total?: number | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          headquarters_state?: string | null
          icp_score?: number | null
          icp_score_breakdown?: Json | null
          id?: string
          industry?: string | null
          investors?: Json | null
          is_disqualified?: boolean | null
          job_postings?: Json | null
          job_postings_count?: number | null
          journey_stage?: string | null
          last_activity_at?: string | null
          last_apollo_sync_at?: string | null
          last_contact_at?: string | null
          last_funding_round_amount?: number | null
          last_funding_round_date?: string | null
          lead_qualified_id?: string | null
          lead_score?: number | null
          lead_score_updated_at?: string | null
          lead_source_id?: string | null
          linkedin_company_id?: string | null
          linkedin_url?: string | null
          location?: Json | null
          loss_details?: string | null
          loss_reason?: string | null
          market_segments?: string[] | null
          meeting_scheduled_at?: string | null
          naics_codes?: string[] | null
          name: string
          news?: Json | null
          next_action?: string | null
          next_action_date?: string | null
          next_action_owner?: string | null
          next_follow_up_action?: string | null
          next_follow_up_date?: string | null
          payment_terms?: string | null
          phone_numbers?: string[] | null
          pipeline_status?: string | null
          proposal_sent_at?: string | null
          proposed_products?: Json | null
          quarantine_id?: string | null
          raw_data?: Json | null
          revenue?: string | null
          revenue_range?: string | null
          revenue_range_from_apollo?: string | null
          sic_codes?: string[] | null
          similar_companies?: Json | null
          social_urls?: Json | null
          stage_changed_at?: string | null
          sub_industry?: string | null
          suggested_leads?: Json | null
          technologies?: string[] | null
          technologies_full?: Json | null
          temperature?: string | null
          total_calls?: number | null
          total_emails?: number | null
          total_meetings?: number | null
          total_whatsapp?: number | null
          totvs_detection_score?: number | null
          totvs_detection_sources?: Json | null
          totvs_last_checked_at?: string | null
          updated_at?: string
          website?: string | null
          website_visitors?: Json | null
          website_visitors_count?: number | null
          website_visitors_data?: Json | null
        }
        Update: {
          account_score?: number | null
          apollo_id?: string | null
          apollo_last_enriched_at?: string | null
          apollo_metadata?: Json | null
          apollo_organization_id?: string | null
          apollo_score?: Json | null
          apollo_signals?: Json | null
          apollo_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          buying_intent_score?: number | null
          buying_intent_signals?: Json | null
          closed_at?: string | null
          cnpj?: string | null
          cnpj_status?: string | null
          company_insights?: Json | null
          competitor_won?: string | null
          created_at?: string
          days_in_stage?: number | null
          deal_notes?: string | null
          deal_probability?: number | null
          deal_stage?: string | null
          deal_value?: number | null
          demo_scheduled_at?: string | null
          digital_maturity_score?: number | null
          discount_percentage?: number | null
          disqualification_reason?: string | null
          domain?: string | null
          employee_count_from_apollo?: number | null
          employee_count_range?: string | null
          employee_trends?: Json | null
          employees?: number | null
          estimated_deal_value?: number | null
          expected_close_date?: string | null
          field_meta?: Json | null
          first_contact_at?: string | null
          founding_year?: number | null
          funding_rounds?: Json | null
          funding_total?: number | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          headquarters_state?: string | null
          icp_score?: number | null
          icp_score_breakdown?: Json | null
          id?: string
          industry?: string | null
          investors?: Json | null
          is_disqualified?: boolean | null
          job_postings?: Json | null
          job_postings_count?: number | null
          journey_stage?: string | null
          last_activity_at?: string | null
          last_apollo_sync_at?: string | null
          last_contact_at?: string | null
          last_funding_round_amount?: number | null
          last_funding_round_date?: string | null
          lead_qualified_id?: string | null
          lead_score?: number | null
          lead_score_updated_at?: string | null
          lead_source_id?: string | null
          linkedin_company_id?: string | null
          linkedin_url?: string | null
          location?: Json | null
          loss_details?: string | null
          loss_reason?: string | null
          market_segments?: string[] | null
          meeting_scheduled_at?: string | null
          naics_codes?: string[] | null
          name?: string
          news?: Json | null
          next_action?: string | null
          next_action_date?: string | null
          next_action_owner?: string | null
          next_follow_up_action?: string | null
          next_follow_up_date?: string | null
          payment_terms?: string | null
          phone_numbers?: string[] | null
          pipeline_status?: string | null
          proposal_sent_at?: string | null
          proposed_products?: Json | null
          quarantine_id?: string | null
          raw_data?: Json | null
          revenue?: string | null
          revenue_range?: string | null
          revenue_range_from_apollo?: string | null
          sic_codes?: string[] | null
          similar_companies?: Json | null
          social_urls?: Json | null
          stage_changed_at?: string | null
          sub_industry?: string | null
          suggested_leads?: Json | null
          technologies?: string[] | null
          technologies_full?: Json | null
          temperature?: string | null
          total_calls?: number | null
          total_emails?: number | null
          total_meetings?: number | null
          total_whatsapp?: number | null
          totvs_detection_score?: number | null
          totvs_detection_sources?: Json | null
          totvs_last_checked_at?: string | null
          updated_at?: string
          website?: string | null
          website_visitors?: Json | null
          website_visitors_count?: number | null
          website_visitors_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_lead_qualified_id_fkey"
            columns: ["lead_qualified_id"]
            isOneToOne: false
            referencedRelation: "leads_qualified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "leads_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_quarantine_id_fkey"
            columns: ["quarantine_id"]
            isOneToOne: false
            referencedRelation: "leads_quarantine"
            referencedColumns: ["id"]
          },
        ]
      }
      company_battle_cards: {
        Row: {
          company_id: string
          competitor_name: string
          competitor_type: string | null
          context_snapshot: Json | null
          created_at: string | null
          detection_confidence: number | null
          generated_at: string | null
          id: string
          next_steps: string[] | null
          objection_handling: Json | null
          proof_points: Json | null
          totvs_advantages: string[] | null
          updated_at: string | null
          win_strategy: string
        }
        Insert: {
          company_id: string
          competitor_name: string
          competitor_type?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          detection_confidence?: number | null
          generated_at?: string | null
          id?: string
          next_steps?: string[] | null
          objection_handling?: Json | null
          proof_points?: Json | null
          totvs_advantages?: string[] | null
          updated_at?: string | null
          win_strategy: string
        }
        Update: {
          company_id?: string
          competitor_name?: string
          competitor_type?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          detection_confidence?: number | null
          generated_at?: string | null
          id?: string
          next_steps?: string[] | null
          objection_handling?: Json | null
          proof_points?: Json | null
          totvs_advantages?: string[] | null
          updated_at?: string | null
          win_strategy?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_battle_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_change_log: {
        Row: {
          changed_at: string
          company_id: string
          field: string
          id: string
          new_value: Json | null
          old_value: Json | null
          reason: string
          source: string
        }
        Insert: {
          changed_at?: string
          company_id: string
          field: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason: string
          source: string
        }
        Update: {
          changed_at?: string
          company_id?: string
          field?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_change_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      company_insights: {
        Row: {
          auto_score: number | null
          company_id: string
          drivers: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_score?: number | null
          company_id: string
          drivers?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_score?: number | null
          company_id?: string
          drivers?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_insights_company"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_jobs: {
        Row: {
          company_id: string
          created_at: string
          id: number
          location: string | null
          portal: string | null
          posted_at: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: never
          location?: string | null
          portal?: string | null
          posted_at?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: never
          location?: string | null
          portal?: string | null
          posted_at?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_jobs_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_monitoring: {
        Row: {
          check_frequency_hours: number | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_intent_check_at: string | null
          last_intent_score: number | null
          last_totvs_check_at: string | null
          last_totvs_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          check_frequency_hours?: number | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_intent_check_at?: string | null
          last_intent_score?: number | null
          last_totvs_check_at?: string | null
          last_totvs_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          check_frequency_hours?: number | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_intent_check_at?: string | null
          last_intent_score?: number | null
          last_totvs_check_at?: string | null
          last_totvs_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_monitoring_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_news: {
        Row: {
          company_id: string
          created_at: string
          id: number
          portal: string | null
          published_at: string | null
          score: number | null
          title: string
          url: string
          why: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: never
          portal?: string | null
          published_at?: string | null
          score?: number | null
          title: string
          url: string
          why?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: never
          portal?: string | null
          published_at?: string | null
          score?: number | null
          title?: string
          url?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_news_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_people: {
        Row: {
          apollo_organization_id: string | null
          company_id: string
          confidence: number | null
          created_at: string
          department: string | null
          is_current: boolean | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          person_id: string
          seniority: string | null
          source: string | null
          title_at_company: string | null
          updated_at: string
        }
        Insert: {
          apollo_organization_id?: string | null
          company_id: string
          confidence?: number | null
          created_at?: string
          department?: string | null
          is_current?: boolean | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          person_id: string
          seniority?: string | null
          source?: string | null
          title_at_company?: string | null
          updated_at?: string
        }
        Update: {
          apollo_organization_id?: string | null
          company_id?: string
          confidence?: number | null
          created_at?: string
          department?: string | null
          is_current?: boolean | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          person_id?: string
          seniority?: string | null
          source?: string | null
          title_at_company?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_people_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_company_people_person"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
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
      company_technologies: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          source: string | null
          technology: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          source?: string | null
          technology: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          source?: string | null
          technology?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_technologies_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_updates: {
        Row: {
          activity_id: string
          company_id: string
          created_at: string
          id: number
          modes: string[]
          organization_id: string
          request_id: string
          updated_count: number
          updated_fields: string[]
        }
        Insert: {
          activity_id: string
          company_id: string
          created_at?: string
          id?: never
          modes: string[]
          organization_id: string
          request_id: string
          updated_count: number
          updated_fields: string[]
        }
        Update: {
          activity_id?: string
          company_id?: string
          created_at?: string
          id?: never
          modes?: string[]
          organization_id?: string
          request_id?: string
          updated_count?: number
          updated_fields?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_updates_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            foreignKeyName: "customer_onboarding_assigned_csm_fkey"
            columns: ["assigned_csm"]
            isOneToOne: false
            referencedRelation: "sdr_performance"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "deal_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "sdr_performance"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "deal_approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "sdr_performance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      decision_makers: {
        Row: {
          apollo_organization_id: string | null
          apollo_person_id: string | null
          apollo_person_url: string | null
          city: string | null
          company_employees: number | null
          company_id: string
          company_industries: Json | null
          company_keywords: Json | null
          company_name: string | null
          country: string | null
          created_at: string
          data_sources: Json | null
          departments: Json | null
          education: Json | null
          email: string | null
          email_status: string | null
          employment_history: Json | null
          first_name: string | null
          id: string
          is_current_at_company: boolean | null
          is_decision_maker: boolean | null
          last_enriched_at: string | null
          last_name: string | null
          linkedin_url: string | null
          mobile_phone: string | null
          name: string
          people_auto_score_label: string | null
          people_auto_score_value: number | null
          phone: string | null
          raw_apollo_data: Json | null
          raw_linkedin_data: Json | null
          recommendations_score: number | null
          rejection_reason: string | null
          seniority: string | null
          state: string | null
          tenure_months: number | null
          tenure_start_date: string | null
          title: string | null
          updated_at: string
          validation_status: string | null
        }
        Insert: {
          apollo_organization_id?: string | null
          apollo_person_id?: string | null
          apollo_person_url?: string | null
          city?: string | null
          company_employees?: number | null
          company_id: string
          company_industries?: Json | null
          company_keywords?: Json | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          data_sources?: Json | null
          departments?: Json | null
          education?: Json | null
          email?: string | null
          email_status?: string | null
          employment_history?: Json | null
          first_name?: string | null
          id?: string
          is_current_at_company?: boolean | null
          is_decision_maker?: boolean | null
          last_enriched_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          name: string
          people_auto_score_label?: string | null
          people_auto_score_value?: number | null
          phone?: string | null
          raw_apollo_data?: Json | null
          raw_linkedin_data?: Json | null
          recommendations_score?: number | null
          rejection_reason?: string | null
          seniority?: string | null
          state?: string | null
          tenure_months?: number | null
          tenure_start_date?: string | null
          title?: string | null
          updated_at?: string
          validation_status?: string | null
        }
        Update: {
          apollo_organization_id?: string | null
          apollo_person_id?: string | null
          apollo_person_url?: string | null
          city?: string | null
          company_employees?: number | null
          company_id?: string
          company_industries?: Json | null
          company_keywords?: Json | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          data_sources?: Json | null
          departments?: Json | null
          education?: Json | null
          email?: string | null
          email_status?: string | null
          employment_history?: Json | null
          first_name?: string | null
          id?: string
          is_current_at_company?: boolean | null
          is_decision_maker?: boolean | null
          last_enriched_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          name?: string
          people_auto_score_label?: string | null
          people_auto_score_value?: number | null
          phone?: string | null
          raw_apollo_data?: Json | null
          raw_linkedin_data?: Json | null
          recommendations_score?: number | null
          rejection_reason?: string | null
          seniority?: string | null
          state?: string | null
          tenure_months?: number | null
          tenure_start_date?: string | null
          title?: string | null
          updated_at?: string
          validation_status?: string | null
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
      discovery_batches: {
        Row: {
          added_to_bank: number
          city: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          max_employees: number | null
          min_employees: number | null
          name: string
          niche_code: string | null
          rejected: number
          search_mode: string
          sector_code: string | null
          source_company_id: string | null
          started_at: string | null
          state: string | null
          status: string
          total_found: number
          updated_at: string
          user_id: string
          validated: number
        }
        Insert: {
          added_to_bank?: number
          city?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_employees?: number | null
          min_employees?: number | null
          name: string
          niche_code?: string | null
          rejected?: number
          search_mode: string
          sector_code?: string | null
          source_company_id?: string | null
          started_at?: string | null
          state?: string | null
          status?: string
          total_found?: number
          updated_at?: string
          user_id: string
          validated?: number
        }
        Update: {
          added_to_bank?: number
          city?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_employees?: number | null
          min_employees?: number | null
          name?: string
          niche_code?: string | null
          rejected?: number
          search_mode?: string
          sector_code?: string | null
          source_company_id?: string | null
          started_at?: string | null
          state?: string | null
          status?: string
          total_found?: number
          updated_at?: string
          user_id?: string
          validated?: number
        }
        Relationships: [
          {
            foreignKeyName: "discovery_batches_niche_code_fkey"
            columns: ["niche_code"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["niche_code"]
          },
          {
            foreignKeyName: "discovery_batches_sector_code_fkey"
            columns: ["sector_code"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["sector_code"]
          },
          {
            foreignKeyName: "discovery_batches_source_company_id_fkey"
            columns: ["source_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      displacement_opportunities: {
        Row: {
          assigned_to: string | null
          company_id: string
          competitor_name: string
          competitor_type: string | null
          created_at: string
          detected_at: string
          displacement_reason: string
          estimated_revenue: number | null
          evidence: string | null
          id: string
          next_action: string | null
          next_action_date: string | null
          opportunity_score: number | null
          raw_data: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          competitor_name: string
          competitor_type?: string | null
          created_at?: string
          detected_at?: string
          displacement_reason: string
          estimated_revenue?: number | null
          evidence?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          opportunity_score?: number | null
          raw_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          competitor_name?: string
          competitor_type?: string | null
          created_at?: string
          detected_at?: string
          displacement_reason?: string
          estimated_revenue?: number | null
          evidence?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          opportunity_score?: number | null
          raw_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "displacement_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_field_mapping: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          priority: number | null
          source_field: string
          source_name: string
          target_field: string
          transformation_rule: Json | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          priority?: number | null
          source_field: string
          source_name: string
          target_field: string
          transformation_rule?: Json | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          priority?: number | null
          source_field?: string
          source_name?: string
          target_field?: string
          transformation_rule?: Json | null
        }
        Relationships: []
      }
      enrichment_usage: {
        Row: {
          company_id: string | null
          count: number | null
          created_at: string | null
          id: string
          source: string
        }
        Insert: {
          company_id?: string | null
          count?: number | null
          created_at?: string | null
          id?: string
          source: string
        }
        Update: {
          company_id?: string | null
          count?: number | null
          created_at?: string | null
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      financial_docs_detected: {
        Row: {
          company_id: string
          company_name: string
          detected_at: string
          doc_type: string
          doc_url: string
          excerpt: string | null
          id: string
          totvs_as_creditor: boolean
          totvs_mentioned: boolean
        }
        Insert: {
          company_id: string
          company_name: string
          detected_at?: string
          doc_type: string
          doc_url: string
          excerpt?: string | null
          id?: string
          totvs_as_creditor?: boolean
          totvs_mentioned?: boolean
        }
        Update: {
          company_id?: string
          company_name?: string
          detected_at?: string
          doc_type?: string
          doc_url?: string
          excerpt?: string | null
          id?: string
          totvs_as_creditor?: boolean
          totvs_mentioned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "financial_docs_detected_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      icp_analysis_history: {
        Row: {
          ai_model_used: string | null
          analysis_duration_ms: number | null
          analysis_version: number
          analyzed_at: string | null
          analyzed_by: string | null
          buying_signals: Json | null
          company_id: string
          competitor_erp: string | null
          estimated_roi: string | null
          has_totvs: boolean | null
          icp_score: number
          id: string
          intent_score: number | null
          pain_points: Json | null
          recommended_products: Json | null
          score_breakdown: Json
          technologies_detected: Json | null
          temperature: string
          totvs_products: Json | null
          value_proposition: string | null
        }
        Insert: {
          ai_model_used?: string | null
          analysis_duration_ms?: number | null
          analysis_version?: number
          analyzed_at?: string | null
          analyzed_by?: string | null
          buying_signals?: Json | null
          company_id: string
          competitor_erp?: string | null
          estimated_roi?: string | null
          has_totvs?: boolean | null
          icp_score: number
          id?: string
          intent_score?: number | null
          pain_points?: Json | null
          recommended_products?: Json | null
          score_breakdown: Json
          technologies_detected?: Json | null
          temperature: string
          totvs_products?: Json | null
          value_proposition?: string | null
        }
        Update: {
          ai_model_used?: string | null
          analysis_duration_ms?: number | null
          analysis_version?: number
          analyzed_at?: string | null
          analyzed_by?: string | null
          buying_signals?: Json | null
          company_id?: string
          competitor_erp?: string | null
          estimated_roi?: string | null
          has_totvs?: boolean | null
          icp_score?: number
          id?: string
          intent_score?: number | null
          pain_points?: Json | null
          recommended_products?: Json | null
          score_breakdown?: Json
          technologies_detected?: Json | null
          temperature?: string
          totvs_products?: Json | null
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icp_analysis_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_audit_log: {
        Row: {
          action: string
          batch_company_id: string | null
          created_at: string
          evidence_snippet: string | null
          evidence_url: string | null
          id: string
          reason: string | null
          validation_rules_applied: Json | null
        }
        Insert: {
          action: string
          batch_company_id?: string | null
          created_at?: string
          evidence_snippet?: string | null
          evidence_url?: string | null
          id?: string
          reason?: string | null
          validation_rules_applied?: Json | null
        }
        Update: {
          action?: string
          batch_company_id?: string | null
          created_at?: string
          evidence_snippet?: string | null
          evidence_url?: string | null
          id?: string
          reason?: string | null
          validation_rules_applied?: Json | null
        }
        Relationships: []
      }
      icp_batch_companies: {
        Row: {
          batch_job_id: string
          cnpj: string | null
          company_id: string | null
          company_name: string
          created_at: string
          domain: string | null
          error_message: string | null
          id: string
          intent_confidence: string | null
          intent_methodology: Json | null
          intent_score: number | null
          intent_signals: Json | null
          niche: string | null
          platforms_scanned: string[] | null
          processed_at: string | null
          region: string | null
          sector: string | null
          status: string
          totvs_disqualification_reason: string | null
          totvs_evidences: Json | null
          totvs_methodology: Json | null
          totvs_score: number | null
          totvs_status: string | null
        }
        Insert: {
          batch_job_id: string
          cnpj?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string
          domain?: string | null
          error_message?: string | null
          id?: string
          intent_confidence?: string | null
          intent_methodology?: Json | null
          intent_score?: number | null
          intent_signals?: Json | null
          niche?: string | null
          platforms_scanned?: string[] | null
          processed_at?: string | null
          region?: string | null
          sector?: string | null
          status?: string
          totvs_disqualification_reason?: string | null
          totvs_evidences?: Json | null
          totvs_methodology?: Json | null
          totvs_score?: number | null
          totvs_status?: string | null
        }
        Update: {
          batch_job_id?: string
          cnpj?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          domain?: string | null
          error_message?: string | null
          id?: string
          intent_confidence?: string | null
          intent_methodology?: Json | null
          intent_score?: number | null
          intent_signals?: Json | null
          niche?: string | null
          platforms_scanned?: string[] | null
          processed_at?: string | null
          region?: string | null
          sector?: string | null
          status?: string
          totvs_disqualification_reason?: string | null
          totvs_evidences?: Json | null
          totvs_methodology?: Json | null
          totvs_score?: number | null
          totvs_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icp_batch_companies_batch_job_id_fkey"
            columns: ["batch_job_id"]
            isOneToOne: false
            referencedRelation: "icp_batch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icp_batch_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_batch_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          disqualified_companies: number
          errors: number
          file_url: string | null
          id: string
          name: string
          niche: string | null
          processed_companies: number
          qualified_companies: number
          region: string | null
          report_url: string | null
          sector: string | null
          source: string
          started_at: string | null
          status: string
          total_companies: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          disqualified_companies?: number
          errors?: number
          file_url?: string | null
          id?: string
          name: string
          niche?: string | null
          processed_companies?: number
          qualified_companies?: number
          region?: string | null
          report_url?: string | null
          sector?: string | null
          source: string
          started_at?: string | null
          status?: string
          total_companies?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          disqualified_companies?: number
          errors?: number
          file_url?: string | null
          id?: string
          name?: string
          niche?: string | null
          processed_companies?: number
          qualified_companies?: number
          region?: string | null
          report_url?: string | null
          sector?: string | null
          source?: string
          started_at?: string | null
          status?: string
          total_companies?: number
          updated_at?: string
          user_id?: string
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
      intelligence_monitoring_config: {
        Row: {
          check_frequency_hours: number | null
          competitor_names: string[] | null
          created_at: string
          custom_niche: string | null
          id: string
          is_active: boolean | null
          keywords_blacklist: string[] | null
          keywords_whitelist: string[] | null
          last_check_at: string | null
          max_employees: number | null
          max_revenue: number | null
          min_employees: number | null
          min_revenue: number | null
          monitor_competitor_mentions: boolean | null
          monitor_digital_transformation: boolean | null
          monitor_expansion: boolean | null
          monitor_funding: boolean | null
          monitor_leadership_changes: boolean | null
          monitor_market_entry: boolean | null
          monitor_partnerships: boolean | null
          monitor_tech_adoption: boolean | null
          next_check_at: string | null
          schedule_name: string | null
          target_cities: string[] | null
          target_mesoregions: string[] | null
          target_microregions: string[] | null
          target_municipalities: string[] | null
          target_niches: string[] | null
          target_regions: string[] | null
          target_sectors: string[] | null
          target_states: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          check_frequency_hours?: number | null
          competitor_names?: string[] | null
          created_at?: string
          custom_niche?: string | null
          id?: string
          is_active?: boolean | null
          keywords_blacklist?: string[] | null
          keywords_whitelist?: string[] | null
          last_check_at?: string | null
          max_employees?: number | null
          max_revenue?: number | null
          min_employees?: number | null
          min_revenue?: number | null
          monitor_competitor_mentions?: boolean | null
          monitor_digital_transformation?: boolean | null
          monitor_expansion?: boolean | null
          monitor_funding?: boolean | null
          monitor_leadership_changes?: boolean | null
          monitor_market_entry?: boolean | null
          monitor_partnerships?: boolean | null
          monitor_tech_adoption?: boolean | null
          next_check_at?: string | null
          schedule_name?: string | null
          target_cities?: string[] | null
          target_mesoregions?: string[] | null
          target_microregions?: string[] | null
          target_municipalities?: string[] | null
          target_niches?: string[] | null
          target_regions?: string[] | null
          target_sectors?: string[] | null
          target_states?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          check_frequency_hours?: number | null
          competitor_names?: string[] | null
          created_at?: string
          custom_niche?: string | null
          id?: string
          is_active?: boolean | null
          keywords_blacklist?: string[] | null
          keywords_whitelist?: string[] | null
          last_check_at?: string | null
          max_employees?: number | null
          max_revenue?: number | null
          min_employees?: number | null
          min_revenue?: number | null
          monitor_competitor_mentions?: boolean | null
          monitor_digital_transformation?: boolean | null
          monitor_expansion?: boolean | null
          monitor_funding?: boolean | null
          monitor_leadership_changes?: boolean | null
          monitor_market_entry?: boolean | null
          monitor_partnerships?: boolean | null
          monitor_tech_adoption?: boolean | null
          next_check_at?: string | null
          schedule_name?: string | null
          target_cities?: string[] | null
          target_mesoregions?: string[] | null
          target_microregions?: string[] | null
          target_municipalities?: string[] | null
          target_niches?: string[] | null
          target_regions?: string[] | null
          target_sectors?: string[] | null
          target_states?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      intent_signals: {
        Row: {
          company_id: string
          confidence_score: number
          created_at: string
          detected_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          signal_description: string | null
          signal_source: string
          signal_title: string
          signal_type: string
          signal_url: string | null
        }
        Insert: {
          company_id: string
          confidence_score?: number
          created_at?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          signal_description?: string | null
          signal_source: string
          signal_title: string
          signal_type: string
          signal_url?: string | null
        }
        Update: {
          company_id?: string
          confidence_score?: number
          created_at?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          signal_description?: string | null
          signal_source?: string
          signal_title?: string
          signal_type?: string
          signal_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intent_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_signals_detection: {
        Row: {
          checked_at: string
          cnpj: string | null
          company_id: string
          company_name: string
          confidence: string | null
          created_at: string
          id: string
          methodology: Json | null
          platforms_scanned: string[] | null
          region: string | null
          score: number
          sector: string | null
          signals: Json
          sources_checked: number
          temperature: string | null
        }
        Insert: {
          checked_at?: string
          cnpj?: string | null
          company_id: string
          company_name: string
          confidence?: string | null
          created_at?: string
          id?: string
          methodology?: Json | null
          platforms_scanned?: string[] | null
          region?: string | null
          score: number
          sector?: string | null
          signals?: Json
          sources_checked?: number
          temperature?: string | null
        }
        Update: {
          checked_at?: string
          cnpj?: string | null
          company_id?: string
          company_name?: string
          confidence?: string | null
          created_at?: string
          id?: string
          methodology?: Json | null
          platforms_scanned?: string[] | null
          region?: string | null
          score?: number
          sector?: string | null
          signals?: Json
          sources_checked?: number
          temperature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intent_signals_detection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          attachments: Json | null
          company_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          interaction_date: string | null
          interaction_type: string
          metadata: Json | null
          next_action_date_suggested: string | null
          next_action_suggested: string | null
          outcome: string | null
          sentiment: string | null
          sentiment_score: number | null
          subject: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          interaction_date?: string | null
          interaction_type: string
          metadata?: Json | null
          next_action_date_suggested?: string | null
          next_action_suggested?: string | null
          outcome?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          subject?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string
          metadata?: Json | null
          next_action_date_suggested?: string | null
          next_action_suggested?: string | null
          outcome?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings_detected: {
        Row: {
          company_id: string
          company_name: string
          detected_at: string
          id: string
          job_description: string | null
          job_title: string
          job_url: string
          location: string | null
          platform: string
          posted_at: string | null
          required_skills: string[] | null
          totvs_products_mentioned: string[] | null
        }
        Insert: {
          company_id: string
          company_name: string
          detected_at?: string
          id?: string
          job_description?: string | null
          job_title: string
          job_url: string
          location?: string | null
          platform: string
          posted_at?: string | null
          required_skills?: string[] | null
          totvs_products_mentioned?: string[] | null
        }
        Update: {
          company_id?: string
          company_name?: string
          detected_at?: string
          id?: string
          job_description?: string | null
          job_title?: string
          job_url?: string
          location?: string | null
          platform?: string
          posted_at?: string | null
          required_skills?: string[] | null
          totvs_products_mentioned?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_detected_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_pool: {
        Row: {
          cnae_principal: string | null
          cnpj: string
          created_at: string | null
          email: string | null
          icp_score: number | null
          id: string
          is_cliente_totvs: boolean | null
          municipio: string | null
          nome_fantasia: string | null
          origem: string
          porte: string | null
          raw_data: Json | null
          razao_social: string
          status: string | null
          telefone: string | null
          temperatura: string | null
          totvs_check_date: string | null
          uf: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          cnae_principal?: string | null
          cnpj: string
          created_at?: string | null
          email?: string | null
          icp_score?: number | null
          id?: string
          is_cliente_totvs?: boolean | null
          municipio?: string | null
          nome_fantasia?: string | null
          origem: string
          porte?: string | null
          raw_data?: Json | null
          razao_social: string
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          totvs_check_date?: string | null
          uf?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          cnae_principal?: string | null
          cnpj?: string
          created_at?: string | null
          email?: string | null
          icp_score?: number | null
          id?: string
          is_cliente_totvs?: boolean | null
          municipio?: string | null
          nome_fantasia?: string | null
          origem?: string
          porte?: string | null
          raw_data?: Json | null
          razao_social?: string
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          totvs_check_date?: string | null
          uf?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      leads_qualified: {
        Row: {
          cnpj: string
          created_at: string | null
          email: string | null
          icp_score: number | null
          id: string
          lead_pool_id: string | null
          motivo_qualificacao: string | null
          municipio: string | null
          nome_fantasia: string | null
          porte: string | null
          razao_social: string
          selected_at: string | null
          selected_by: string | null
          status: string | null
          telefone: string | null
          temperatura: string | null
          uf: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          email?: string | null
          icp_score?: number | null
          id?: string
          lead_pool_id?: string | null
          motivo_qualificacao?: string | null
          municipio?: string | null
          nome_fantasia?: string | null
          porte?: string | null
          razao_social: string
          selected_at?: string | null
          selected_by?: string | null
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          uf?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          email?: string | null
          icp_score?: number | null
          id?: string
          lead_pool_id?: string | null
          motivo_qualificacao?: string | null
          municipio?: string | null
          nome_fantasia?: string | null
          porte?: string | null
          razao_social?: string
          selected_at?: string | null
          selected_by?: string | null
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          uf?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_qualified_lead_pool_id_fkey"
            columns: ["lead_pool_id"]
            isOneToOne: false
            referencedRelation: "leads_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_quarantine: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_score: number | null
          buying_signals: Json | null
          captured_at: string | null
          city: string | null
          cnpj: string | null
          cnpj_status: string | null
          cnpj_valid: boolean | null
          company_size: string | null
          competitor_erp: string | null
          created_at: string | null
          data_quality_score: number | null
          email: string | null
          email_verified: boolean | null
          employees: number | null
          enriched_data: Json | null
          enrichment_status: string | null
          has_email: boolean | null
          has_linkedin: boolean | null
          has_totvs: boolean | null
          id: string
          intent_score: number | null
          name: string
          niche: string | null
          notes: string | null
          phone: string | null
          region: string | null
          rejected_at: string | null
          rejection_reason: string | null
          revenue: number | null
          sector: string | null
          source_id: string | null
          source_metadata: Json | null
          state: string | null
          technologies_detected: Json | null
          totvs_products: Json | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_score: number | null
          validation_status: string | null
          website: string | null
          website_active: boolean | null
          website_ssl: boolean | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_score?: number | null
          buying_signals?: Json | null
          captured_at?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_status?: string | null
          cnpj_valid?: boolean | null
          company_size?: string | null
          competitor_erp?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          email?: string | null
          email_verified?: boolean | null
          employees?: number | null
          enriched_data?: Json | null
          enrichment_status?: string | null
          has_email?: boolean | null
          has_linkedin?: boolean | null
          has_totvs?: boolean | null
          id?: string
          intent_score?: number | null
          name: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          revenue?: number | null
          sector?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          state?: string | null
          technologies_detected?: Json | null
          totvs_products?: Json | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_score?: number | null
          validation_status?: string | null
          website?: string | null
          website_active?: boolean | null
          website_ssl?: boolean | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_score?: number | null
          buying_signals?: Json | null
          captured_at?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_status?: string | null
          cnpj_valid?: boolean | null
          company_size?: string | null
          competitor_erp?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          email?: string | null
          email_verified?: boolean | null
          employees?: number | null
          enriched_data?: Json | null
          enrichment_status?: string | null
          has_email?: boolean | null
          has_linkedin?: boolean | null
          has_totvs?: boolean | null
          id?: string
          intent_score?: number | null
          name?: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          revenue?: number | null
          sector?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          state?: string | null
          technologies_detected?: Json | null
          totvs_products?: Json | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_score?: number | null
          validation_status?: string | null
          website?: string | null
          website_active?: boolean | null
          website_ssl?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_quarantine_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "leads_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_sources: {
        Row: {
          api_credentials: Json | null
          config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          source_name: string
          success_rate: number | null
          total_approved: number | null
          total_captured: number | null
          updated_at: string | null
        }
        Insert: {
          api_credentials?: Json | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          source_name: string
          success_rate?: number | null
          total_approved?: number | null
          total_captured?: number | null
          updated_at?: string | null
        }
        Update: {
          api_credentials?: Json | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          source_name?: string
          success_rate?: number | null
          total_approved?: number | null
          total_captured?: number | null
          updated_at?: string | null
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
      niches: {
        Row: {
          cnaes: string[] | null
          created_at: string
          description: string | null
          id: string
          keywords: string[]
          ncms: string[] | null
          niche_code: string
          niche_name: string
          sector_code: string
          totvs_products: string[] | null
        }
        Insert: {
          cnaes?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          keywords: string[]
          ncms?: string[] | null
          niche_code: string
          niche_name: string
          sector_code: string
          totvs_products?: string[] | null
        }
        Update: {
          cnaes?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          ncms?: string[] | null
          niche_code?: string
          niche_name?: string
          sector_code?: string
          totvs_products?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "niches_sector_code_fkey"
            columns: ["sector_code"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["sector_code"]
          },
        ]
      }
      people: {
        Row: {
          apollo_person_id: string | null
          city: string | null
          country: string | null
          created_at: string
          current_company_apollo_id: string | null
          current_company_linkedin_id: string | null
          department: string | null
          email_hash: string | null
          email_primary: string | null
          email_status: string | null
          ended_at: string | null
          first_name: string | null
          full_name: string | null
          headline: string | null
          id: string
          job_title: string | null
          languages: Json | null
          last_name: string | null
          last_seen_at: string | null
          last_updated_at: string | null
          linkedin_profile_id: string | null
          linkedin_url: string | null
          phones: Json | null
          seniority: string | null
          skills: Json | null
          source: string | null
          started_at: string | null
          state: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          apollo_person_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_company_apollo_id?: string | null
          current_company_linkedin_id?: string | null
          department?: string | null
          email_hash?: string | null
          email_primary?: string | null
          email_status?: string | null
          ended_at?: string | null
          first_name?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          last_seen_at?: string | null
          last_updated_at?: string | null
          linkedin_profile_id?: string | null
          linkedin_url?: string | null
          phones?: Json | null
          seniority?: string | null
          skills?: Json | null
          source?: string | null
          started_at?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          apollo_person_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_company_apollo_id?: string | null
          current_company_linkedin_id?: string | null
          department?: string | null
          email_hash?: string | null
          email_primary?: string | null
          email_status?: string | null
          ended_at?: string | null
          first_name?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          last_seen_at?: string | null
          last_updated_at?: string | null
          linkedin_profile_id?: string | null
          linkedin_url?: string | null
          phones?: Json | null
          seniority?: string | null
          skills?: Json | null
          source?: string | null
          started_at?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
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
          lead_score: number | null
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
          lead_score?: number | null
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
          lead_score?: number | null
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
            foreignKeyName: "sdr_deals_assigned_sales_rep_fkey"
            columns: ["assigned_sales_rep"]
            isOneToOne: false
            referencedRelation: "sdr_performance"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "sdr_handoffs_from_sdr_fkey"
            columns: ["from_sdr"]
            isOneToOne: false
            referencedRelation: "sdr_performance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sdr_handoffs_to_sales_rep_fkey"
            columns: ["to_sales_rep"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_handoffs_to_sales_rep_fkey"
            columns: ["to_sales_rep"]
            isOneToOne: false
            referencedRelation: "sdr_performance"
            referencedColumns: ["user_id"]
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
      sdr_workflows: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_type?: string
          updated_at?: string | null
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
      sectors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sector_code: string
          sector_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sector_code: string
          sector_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sector_code?: string
          sector_name?: string
        }
        Relationships: []
      }
      similar_companies: {
        Row: {
          company_id: string
          created_at: string
          employees_max: number | null
          employees_min: number | null
          location: string | null
          similar_company_external_id: string
          similar_name: string | null
          similarity_score: number | null
          source: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          employees_max?: number | null
          employees_min?: number | null
          location?: string | null
          similar_company_external_id: string
          similar_name?: string | null
          similarity_score?: number | null
          source?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          employees_max?: number | null
          employees_min?: number | null
          location?: string | null
          similar_company_external_id?: string
          similar_name?: string | null
          similarity_score?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_similar_companies_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suggested_companies: {
        Row: {
          added_to_bank_at: string | null
          apollo_data: Json | null
          city: string | null
          cnpj: string | null
          cnpj_validated: boolean | null
          company_id: string | null
          company_name: string
          created_at: string
          discovery_batch_id: string | null
          domain: string | null
          id: string
          linkedin_data: Json | null
          linkedin_url: string | null
          niche_code: string | null
          receita_ws_data: Json | null
          sector_code: string | null
          similarity_reasons: string[] | null
          similarity_score: number | null
          source: string
          source_company_id: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_to_bank_at?: string | null
          apollo_data?: Json | null
          city?: string | null
          cnpj?: string | null
          cnpj_validated?: boolean | null
          company_id?: string | null
          company_name: string
          created_at?: string
          discovery_batch_id?: string | null
          domain?: string | null
          id?: string
          linkedin_data?: Json | null
          linkedin_url?: string | null
          niche_code?: string | null
          receita_ws_data?: Json | null
          sector_code?: string | null
          similarity_reasons?: string[] | null
          similarity_score?: number | null
          source: string
          source_company_id?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_to_bank_at?: string | null
          apollo_data?: Json | null
          city?: string | null
          cnpj?: string | null
          cnpj_validated?: boolean | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          discovery_batch_id?: string | null
          domain?: string | null
          id?: string
          linkedin_data?: Json | null
          linkedin_url?: string | null
          niche_code?: string | null
          receita_ws_data?: Json | null
          sector_code?: string | null
          similarity_reasons?: string[] | null
          similarity_score?: number | null
          source?: string
          source_company_id?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_companies_niche_code_fkey"
            columns: ["niche_code"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["niche_code"]
          },
          {
            foreignKeyName: "suggested_companies_sector_code_fkey"
            columns: ["sector_code"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["sector_code"]
          },
          {
            foreignKeyName: "suggested_companies_source_company_id_fkey"
            columns: ["source_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      totvs_usage_detection: {
        Row: {
          checked_at: string
          cnpj: string | null
          company_id: string
          company_name: string
          confidence: string | null
          created_at: string
          disqualification_reason: string | null
          evidences: Json
          id: string
          methodology: Json | null
          platforms_scanned: string[] | null
          region: string | null
          score: number
          sector: string | null
          sources_checked: number
          status: string
        }
        Insert: {
          checked_at?: string
          cnpj?: string | null
          company_id: string
          company_name: string
          confidence?: string | null
          created_at?: string
          disqualification_reason?: string | null
          evidences?: Json
          id?: string
          methodology?: Json | null
          platforms_scanned?: string[] | null
          region?: string | null
          score: number
          sector?: string | null
          sources_checked?: number
          status: string
        }
        Update: {
          checked_at?: string
          cnpj?: string | null
          company_id?: string
          company_name?: string
          confidence?: string | null
          created_at?: string
          disqualification_reason?: string | null
          evidences?: Json
          id?: string
          methodology?: Json | null
          platforms_scanned?: string[] | null
          region?: string | null
          score?: number
          sector?: string | null
          sources_checked?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "totvs_usage_detection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      buying_signals_summary: {
        Row: {
          avg_confidence: number | null
          company_id: string | null
          high_priority_signals: number | null
          last_signal_date: string | null
          new_signals: number | null
          signal_types: Json | null
          total_signals: number | null
          urgent_signals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buying_signals_company_id_fkey1"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_overview: {
        Row: {
          assigned_count: number | null
          avg_icp_score: number | null
          journey_stage: string | null
          temperature: string | null
          total_companies: number | null
          total_pipeline_value: number | null
          with_next_action: number | null
        }
        Relationships: []
      }
      sdr_performance: {
        Row: {
          avg_icp_score: number | null
          total_calls: number | null
          total_companies_assigned: number | null
          total_interactions: number | null
          total_lost: number | null
          total_meetings: number | null
          total_revenue: number | null
          total_won: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      source_performance: {
        Row: {
          avg_auto_score: number | null
          is_active: boolean | null
          priority: number | null
          source_name: string | null
          total_approved: number | null
          total_captured: number | null
          total_converted_to_companies: number | null
          total_rejected: number | null
          total_won: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_deal_health_score: {
        Args: { deal_id: string }
        Returns: number
      }
      calculate_engagement_score: {
        Args: { p_company_id: string }
        Returns: number
      }
      calculate_intent_score: {
        Args: { company_uuid: string }
        Returns: number
      }
      calculate_lead_score: { Args: { p_company_id: string }; Returns: number }
      calculate_size_score: { Args: { p_company_id: string }; Returns: number }
      create_canvas_version: {
        Args: { p_canvas_id: string; p_description?: string; p_tag?: string }
        Returns: string
      }
      get_companies_for_monitoring_check: {
        Args: { batch_limit?: number }
        Returns: {
          company_cnpj: string
          company_domain: string
          company_id: string
          company_name: string
          hours_since_last_check: number
          last_intent_score: number
          last_totvs_score: number
          monitoring_id: string
          user_id: string
        }[]
      }
      get_hot_leads: {
        Args: { min_intent_score?: number }
        Returns: {
          company_id: string
          company_name: string
          intent_score: number
          signal_count: number
          totvs_score: number
        }[]
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
      increment_apollo_credits: {
        Args: { credits_consumed: number }
        Returns: undefined
      }
      promote_canvas_decision: {
        Args: { p_block_id: string; p_target_type: string }
        Returns: string
      }
      recalculate_all_lead_scores: {
        Args: { batch_size?: number }
        Returns: {
          company_id: string
          company_name: string
          new_score: number
          old_score: number
        }[]
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
