// Supabase Database Types
// These types match the Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          settings: Json
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          settings?: Json
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          settings?: Json
        }
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role_id: string
          status: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role_id: string
          status?: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role_id?: string
          status?: string
          joined_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          display_name: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          client_name: string
          status: string
          monthly_post_target: number
          total_budget: number | null
          settings: Json
          created_by: string
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          client_name: string
          status?: string
          monthly_post_target?: number
          total_budget?: number | null
          settings?: Json
          created_by: string
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          client_name?: string
          status?: string
          monthly_post_target?: number
          total_budget?: number | null
          settings?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role_id: string
          is_lead: boolean
          added_by: string | null
          added_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role_id: string
          is_lead?: boolean
          added_by?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role_id?: string
          is_lead?: boolean
          added_by?: string | null
          added_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          project_id: string
          title: string
          content: string
          reference_image_url: string | null
          planned_post_date: string | null
          status: string
          post_type: string
          platforms: string[]
          created_by: string
          created_at: string
          submitted_at: string | null
          approved_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          content: string
          reference_image_url?: string | null
          planned_post_date?: string | null
          status?: string
          post_type: string
          platforms?: string[]
          created_by: string
          created_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          content?: string
          reference_image_url?: string | null
          planned_post_date?: string | null
          status?: string
          post_type?: string
          platforms?: string[]
          created_by?: string
          created_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          updated_at?: string
        }
      }
      idea_comments: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      idea_approvals: {
        Row: {
          id: string
          idea_id: string
          approver_id: string
          approver_role: string
          action: string
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          approver_id: string
          approver_role: string
          action: string
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          approver_id?: string
          approver_role?: string
          action?: string
          comments?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          project_id: string | null
          type: string
          title: string
          message: string
          is_read: boolean
          link_url: string | null
          sender_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          project_id?: string | null
          type: string
          title: string
          message: string
          is_read?: boolean
          link_url?: string | null
          sender_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          project_id?: string | null
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          link_url?: string | null
          sender_id?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          organization_id: string | null
          type: string
          name: string | null
          project_id: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          type: string
          name?: string | null
          project_id?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          type?: string
          name?: string | null
          project_id?: string | null
          last_message_at?: string | null
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          content: string
          attachment_url: string | null
          attachment_name: string | null
          attachment_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          content: string
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          content?: string
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_type?: string | null
          created_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          organization_id: string
          role_id: string
          invited_by: string
          personal_message: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          organization_id: string
          role_id: string
          invited_by: string
          personal_message?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          organization_id?: string
          role_id?: string
          invited_by?: string
          personal_message?: string | null
          status?: string
          created_at?: string
        }
      }
      idea_assets: {
        Row: {
          id: string
          idea_id: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          version_number: number
          status: string
          uploaded_by: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          version_number?: number
          status?: string
          uploaded_by: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          file_url?: string
          file_name?: string
          file_type?: string
          file_size?: number
          version_number?: number
          status?: string
          uploaded_by?: string
          notes?: string | null
          created_at?: string
        }
      }
      asset_reviews: {
        Row: {
          id: string
          asset_id: string
          reviewer_id: string
          action: string
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          reviewer_id: string
          action: string
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          reviewer_id?: string
          action?: string
          comments?: string | null
          created_at?: string
        }
      }
      asset_annotations: {
        Row: {
          id: string
          asset_id: string
          user_id: string
          x: number
          y: number
          comment: string
          is_resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          user_id: string
          x: number
          y: number
          comment: string
          is_resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          user_id?: string
          x?: number
          y?: number
          comment?: string
          is_resolved?: boolean
          created_at?: string
        }
      }
      time_logs: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          project_id: string | null
          task_id: string | null
          description: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          project_id?: string | null
          task_id?: string | null
          description?: string | null
          start_time: string
          end_time?: string | null
          duration_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          project_id?: string | null
          task_id?: string | null
          description?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          organization_id: string
          project_id: string | null
          user_id: string
          action_type: string
          entity_type: string
          entity_id: string | null
          details: any
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id?: string | null
          user_id: string
          action_type: string
          entity_type: string
          entity_id?: string | null
          details?: any
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string | null
          user_id?: string
          action_type?: string
          entity_type?: string
          entity_id?: string | null
          details?: any
          created_at?: string
        }
      }
      project_budgets: {
        Row: {
          id: string
          project_id: string
          total_budget: number
          budget_spent: number
          currency: string
          start_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          total_budget?: number
          budget_spent?: number
          currency?: string
          start_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          total_budget?: number
          budget_spent?: number
          currency?: string
          start_date?: string | null
          created_at?: string
        }
      }
      post_campaigns: {
        Row: {
          id: string
          project_id: string
          campaign_name: string
          platforms: string[]
          budget_allocated: number
          budget_spent: number
          status: string
          start_date: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          campaign_name: string
          platforms?: string[]
          budget_allocated?: number
          budget_spent?: number
          status?: string
          start_date: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          campaign_name?: string
          platforms?: string[]
          budget_allocated?: number
          budget_spent?: number
          status?: string
          start_date?: string
          created_by?: string
          created_at?: string
        }
      }
      campaign_metrics: {
        Row: {
          id: string
          post_campaign_id: string
          platform: string
          date: string
          impressions: number
          clicks: number
          spend: number
          conversions: number
          conversion_value: number
          created_at: string
        }
        Insert: {
          id?: string
          post_campaign_id: string
          platform: string
          date: string
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          conversion_value?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_campaign_id?: string
          platform?: string
          date?: string
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          conversion_value?: number
          created_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          project_id: string
          name: string
          is_enabled: boolean
          trigger_type: string
          trigger_value: string | null
          action_type: string
          action_value: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          is_enabled?: boolean
          trigger_type: string
          trigger_value?: string | null
          action_type: string
          action_value: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          is_enabled?: boolean
          trigger_type?: string
          trigger_value?: string | null
          action_type?: string
          action_value?: string
          created_by?: string
          created_at?: string
        }
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
  }
}
