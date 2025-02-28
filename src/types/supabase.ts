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
      // ... existing tables ...

      check_in_codes: {
        Row: {
          id: string
          code: string
          user_id: string
          academia_id: string
          status: 'pending' | 'used' | 'expired'
          created_at: string
          used_at: string | null
          expires_at: string
        }
        Insert: {
          id?: string
          code: string
          user_id: string
          academia_id: string
          status: 'pending' | 'used' | 'expired'
          created_at?: string
          used_at?: string | null
          expires_at?: string
        }
        Update: {
          id?: string
          code?: string
          user_id?: string
          academia_id?: string
          status?: 'pending' | 'used' | 'expired'
          created_at?: string
          used_at?: string | null
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_codes_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          }
        ]
      }

      check_ins: {
        Row: {
          id: string
          user_id: string
          academia_id: string
          subscription_id: string
          check_in_code_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          academia_id: string
          subscription_id: string
          check_in_code_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          academia_id?: string
          subscription_id?: string
          check_in_code_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_plan_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_check_in_code_id_fkey"
            columns: ["check_in_code_id"]
            isOneToOne: false
            referencedRelation: "check_in_codes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    // ... rest of the types ...
  }
} 