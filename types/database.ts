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
