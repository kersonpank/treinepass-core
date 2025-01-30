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
      academia_categorias: {
        Row: {
          active: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      academia_modalidades: {
        Row: {
          academia_id: string
          created_at: string
          id: string
          modalidade_id: string
        }
        Insert: {
          academia_id: string
          created_at?: string
          id?: string
          modalidade_id: string
        }
        Update: {
          academia_id?: string
          created_at?: string
          id?: string
          modalidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_modalidades_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_modalidades_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
        ]
      }
      academias: {
        Row: {
          categoria_id: string | null
          cnpj: string
          created_at: string | null
          email: string
          endereco: string | null
          fotos: Json | null
          horario_funcionamento: Json | null
          id: string
          modalidades: string[] | null
          nome: string
          status: string | null
          telefone: string | null
          updated_at: string | null
          usa_regras_personalizadas: boolean | null
          user_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          cnpj: string
          created_at?: string | null
          email: string
          endereco?: string | null
          fotos?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          modalidades?: string[] | null
          nome: string
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          usa_regras_personalizadas?: boolean | null
          user_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          cnpj?: string
          created_at?: string | null
          email?: string
          endereco?: string | null
          fotos?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          modalidades?: string[] | null
          nome?: string
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          usa_regras_personalizadas?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "academia_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          active: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      benefit_plans: {
        Row: {
          business_id: string | null
          created_at: string
          description: string | null
          final_user_cost: number | null
          id: string
          monthly_cost: number
          name: string
          period_type: string
          plan_type: string
          rules: Json
          status: string
          subsidy_amount: number | null
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          final_user_cost?: number | null
          id?: string
          monthly_cost: number
          name: string
          period_type?: string
          plan_type?: string
          rules?: Json
          status?: string
          subsidy_amount?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          final_user_cost?: number | null
          id?: string
          monthly_cost?: number
          name?: string
          period_type?: string
          plan_type?: string
          rules?: Json
          status?: string
          subsidy_amount?: number | null
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
          check_in_code_id: string | null
          check_out: string | null
          created_at: string
          employee_id: string
          id: string
          validation_method:
            | Database["public"]["Enums"]["check_in_validation_method"]
            | null
        }
        Insert: {
          academia_id: string
          check_in?: string
          check_in_code_id?: string | null
          check_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          validation_method?:
            | Database["public"]["Enums"]["check_in_validation_method"]
            | null
        }
        Update: {
          academia_id?: string
          check_in?: string
          check_in_code_id?: string | null
          check_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          validation_method?:
            | Database["public"]["Enums"]["check_in_validation_method"]
            | null
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
            foreignKeyName: "benefit_usage_check_in_code_id_fkey"
            columns: ["check_in_code_id"]
            isOneToOne: false
            referencedRelation: "check_in_codes"
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
      check_in_codes: {
        Row: {
          academia_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          qr_data: Json
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          academia_id: string
          code: string
          created_at?: string
          expires_at: string
          id?: string
          qr_data: Json
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          academia_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          qr_data?: Json
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_codes_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
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
          active: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          active?: boolean | null
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
      plan_rules: {
        Row: {
          created_at: string
          default_value: Json
          description: string | null
          id: string
          name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: Json
          description?: string | null
          id?: string
          name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: Json
          description?: string | null
          id?: string
          name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
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
      regras_repasse: {
        Row: {
          academia_id: string | null
          active: boolean | null
          checkins_maximos: number | null
          checkins_minimos: number
          created_at: string
          id: string
          updated_at: string
          valor_repasse: number
        }
        Insert: {
          academia_id?: string | null
          active?: boolean | null
          checkins_maximos?: number | null
          checkins_minimos: number
          created_at?: string
          id?: string
          updated_at?: string
          valor_repasse: number
        }
        Update: {
          academia_id?: string | null
          active?: boolean | null
          checkins_maximos?: number | null
          checkins_minimos?: number
          created_at?: string
          id?: string
          updated_at?: string
          valor_repasse?: number
        }
        Relationships: [
          {
            foreignKeyName: "regras_repasse_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_repasse_categoria: {
        Row: {
          active: boolean | null
          categoria_id: string | null
          checkins_maximos: number | null
          checkins_minimos: number
          created_at: string
          id: string
          updated_at: string
          valor_repasse: number
        }
        Insert: {
          active?: boolean | null
          categoria_id?: string | null
          checkins_maximos?: number | null
          checkins_minimos: number
          created_at?: string
          id?: string
          updated_at?: string
          valor_repasse: number
        }
        Update: {
          active?: boolean | null
          categoria_id?: string | null
          checkins_maximos?: number | null
          checkins_minimos?: number
          created_at?: string
          id?: string
          updated_at?: string
          valor_repasse?: number
        }
        Relationships: [
          {
            foreignKeyName: "regras_repasse_categoria_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "academia_categorias"
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
        Relationships: []
      }
      user_plan_subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["plan_subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id: string
          start_date: string
          status?: Database["public"]["Enums"]["plan_subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["plan_subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          cpf: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_types: {
        Row: {
          created_at: string | null
          id: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          type?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_check_in: {
        Args: {
          p_user_id: string
          p_academia_id: string
        }
        Returns: {
          can_check_in: boolean
          message: string
        }[]
      }
      check_and_expire_plans: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_user_by_cpf: {
        Args: {
          p_cpf: string
        }
        Returns: string
      }
      create_academia_v2: {
        Args: {
          p_user_id: string
          p_nome: string
          p_cnpj: string
          p_telefone: string
          p_email: string
          p_endereco: string
          p_horario_funcionamento: Json
          p_modalidades: string[]
          p_status?: string
        }
        Returns: {
          academia_id: string
          user_type: string
          success: boolean
          message: string
        }[]
      }
      get_user_access_types: {
        Args: {
          p_user_id: string
        }
        Returns: {
          type: Database["public"]["Enums"]["user_role_type"]
          profile_id: string
          details: Json
        }[]
      }
      get_valor_repasse_academia: {
        Args: {
          p_academia_id: string
          p_num_checkins: number
        }
        Returns: {
          valor_repasse: number
          origem: string
          descricao: string
        }[]
      }
      is_gym_owner: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      register_academia_with_user: {
        Args: {
          p_nome: string
          p_cnpj: string
          p_telefone: string
          p_email: string
          p_senha: string
          p_endereco: string
          p_horario_funcionamento: Json
          p_modalidades: string[]
          p_status?: string
        }
        Returns: Database["public"]["CompositeTypes"]["registration_result"]
      }
      register_check_in: {
        Args: {
          p_check_in_code_id: string
          p_validation_method: Database["public"]["Enums"]["check_in_validation_method"]
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      validate_check_in_code: {
        Args: {
          p_code: string
          p_academia_id: string
        }
        Returns: {
          is_valid: boolean
          message: string
          id: string
          user_id: string
          user_name: string
        }[]
      }
    }
    Enums: {
      check_in_validation_method: "qr_code" | "manual_code"
      gym_role: "gym_owner" | "gym_admin" | "gym_staff"
      plan_subscription_status: "active" | "pending" | "expired" | "cancelled"
      user_role_type:
        | "individual"
        | "business"
        | "gym"
        | "admin"
        | "gym_owner"
        | "app_user"
    }
    CompositeTypes: {
      registration_result: {
        success: boolean | null
        message: string | null
        user_id: string | null
        academia_id: string | null
      }
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
