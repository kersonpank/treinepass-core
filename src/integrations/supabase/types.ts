export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academias: {
        Row: {
          cnpj: string
          created_at: string
          documentos: string[] | null
          email: string
          endereco: string
          fotos: string[] | null
          horario_funcionamento: Json
          id: string
          latitude: number | null
          longitude: number | null
          modalidades: string[]
          nome: string
          status: string | null
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          documentos?: string[] | null
          email: string
          endereco: string
          fotos?: string[] | null
          horario_funcionamento: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          modalidades: string[]
          nome: string
          status?: string | null
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          documentos?: string[] | null
          email?: string
          endereco?: string
          fotos?: string[] | null
          horario_funcionamento?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          modalidades?: string[]
          nome?: string
          status?: string | null
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      benefit_plans: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          monthly_cost: number
          name: string
          plan_type: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          monthly_cost: number
          name: string
          plan_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          monthly_cost?: number
          name?: string
          plan_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_plans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_usage: {
        Row: {
          academia_id: string
          check_in: string
          check_out: string | null
          created_at: string
          employee_id: string
          id: string
        }
        Insert: {
          academia_id: string
          check_in?: string
          check_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          academia_id?: string
          check_in?: string
          check_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_usage_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_usage_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          address: string
          cnpj: string
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone: string
          contact_position: string
          created_at: string
          data_termos_aceitos: string | null
          documentos: Json | null
          email: string
          id: string
          industry: string | null
          inscricao_estadual: string | null
          number_of_employees: number
          phone: string
          plano_modalidade: string | null
          plano_pagamento_dia: number | null
          plano_tipo: string | null
          status: string
          telefone_secundario: string | null
          termos_aceitos: boolean | null
          trading_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          cnpj: string
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone: string
          contact_position: string
          created_at?: string
          data_termos_aceitos?: string | null
          documentos?: Json | null
          email: string
          id?: string
          industry?: string | null
          inscricao_estadual?: string | null
          number_of_employees: number
          phone: string
          plano_modalidade?: string | null
          plano_pagamento_dia?: number | null
          plano_tipo?: string | null
          status?: string
          telefone_secundario?: string | null
          termos_aceitos?: boolean | null
          trading_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          cnpj?: string
          company_name?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string
          contact_position?: string
          created_at?: string
          data_termos_aceitos?: string | null
          documentos?: Json | null
          email?: string
          id?: string
          industry?: string | null
          inscricao_estadual?: string | null
          number_of_employees?: number
          phone?: string
          plano_modalidade?: string | null
          plano_pagamento_dia?: number | null
          plano_tipo?: string | null
          status?: string
          telefone_secundario?: string | null
          termos_aceitos?: boolean | null
          trading_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_benefits: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          plan_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          business_id: string
          cost_center: string | null
          cpf: string
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          cost_center?: string | null
          cpf: string
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          cost_center?: string | null
          cpf?: string
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          due_date: string
          id: string
          invoice_url: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_change_history: {
        Row: {
          changed_by: string | null
          changes: Json
          created_at: string
          id: string
          plan_id: string
          version_id: string | null
        }
        Insert: {
          changed_by?: string | null
          changes: Json
          created_at?: string
          id?: string
          plan_id: string
          version_id?: string | null
        }
        Update: {
          changed_by?: string | null
          changes?: Json
          created_at?: string
          id?: string
          plan_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_change_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_change_history_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          monthly_cost: number
          name: string
          plan_id: string
          rules: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          monthly_cost: number
          name: string
          plan_id: string
          rules?: Json | null
          updated_at?: string
          version: number
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          monthly_cost?: number
          name?: string
          plan_id?: string
          rules?: Json | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gym_roles: {
        Row: {
          active: boolean
          created_at: string
          gym_id: string
          id: string
          role: Database["public"]["Enums"]["gym_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          gym_id: string
          id?: string
          role: Database["public"]["Enums"]["gym_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          gym_id?: string
          id?: string
          role?: Database["public"]["Enums"]["gym_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gym_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          birth_date: string
          cpf: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          cpf: string
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          cpf?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_types: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          type?: string
          user_id?: string
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
      gym_role: "gym_owner" | "gym_admin" | "gym_staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
