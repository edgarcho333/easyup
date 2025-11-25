// Supabase Database Types
// These will be generated from Supabase once we create the schema

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
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
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
