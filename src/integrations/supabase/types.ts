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
          valor_repasse_checkin: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string
          valor_repasse_checkin?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string
          valor_repasse_checkin?: number | null
        }
        Relationships: []
      }
      academia_dados_bancarios: {
        Row: {
          academia_id: string
          agencia: string | null
          agencia_digito: string | null
          banco_codigo: string | null
          banco_nome: string | null
          chave_pix: string | null
          conta: string | null
          conta_digito: string | null
          created_at: string
          id: string
          metodo_preferencial: string
          tipo_chave_pix: string | null
          tipo_conta: string | null
          titular_cpf_cnpj: string
          titular_nome: string
          titular_tipo: string
          updated_at: string
        }
        Insert: {
          academia_id: string
          agencia?: string | null
          agencia_digito?: string | null
          banco_codigo?: string | null
          banco_nome?: string | null
          chave_pix?: string | null
          conta?: string | null
          conta_digito?: string | null
          created_at?: string
          id?: string
          metodo_preferencial?: string
          tipo_chave_pix?: string | null
          tipo_conta?: string | null
          titular_cpf_cnpj: string
          titular_nome: string
          titular_tipo: string
          updated_at?: string
        }
        Update: {
          academia_id?: string
          agencia?: string | null
          agencia_digito?: string | null
          banco_codigo?: string | null
          banco_nome?: string | null
          chave_pix?: string | null
          conta?: string | null
          conta_digito?: string | null
          created_at?: string
          id?: string
          metodo_preferencial?: string
          tipo_chave_pix?: string | null
          tipo_conta?: string | null
          titular_cpf_cnpj?: string
          titular_nome?: string
          titular_tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_dados_bancarios_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_documentos: {
        Row: {
          academia_id: string | null
          caminho: string
          created_at: string | null
          deleted_at: string | null
          deleted_by_gym: boolean | null
          id: string
          nome: string
          observacoes: string | null
          revisado_por: string | null
          status: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          academia_id?: string | null
          caminho: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by_gym?: boolean | null
          id?: string
          nome: string
          observacoes?: string | null
          revisado_por?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          academia_id?: string | null
          caminho?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by_gym?: boolean | null
          id?: string
          nome?: string
          observacoes?: string | null
          revisado_por?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academia_documentos_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
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
          automatic_checkin: boolean | null
          categoria_id: string | null
          cnpj: string
          created_at: string | null
          documentos: Json | null
          documentos_status: string | null
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
          automatic_checkin?: boolean | null
          categoria_id?: string | null
          cnpj: string
          created_at?: string | null
          documentos?: Json | null
          documentos_status?: string | null
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
          automatic_checkin?: boolean | null
          categoria_id?: string | null
          cnpj?: string
          created_at?: string | null
          documentos?: Json | null
          documentos_status?: string | null
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
      asaas_customers: {
        Row: {
          asaas_id: string
          business_id: string | null
          cpf_cnpj: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_id: string
          business_id?: string | null
          cpf_cnpj: string
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_id?: string
          business_id?: string | null
          cpf_cnpj?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_ids: {
        Row: {
          asaas_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          status: string
          updated_at: string | null
          validation_date: string | null
        }
        Insert: {
          asaas_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          validation_date?: string | null
        }
        Update: {
          asaas_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          validation_date?: string | null
        }
        Relationships: []
      }
      asaas_payments: {
        Row: {
          amount: number
          asaas_id: string
          asaas_payment_link: string | null
          billing_type: string
          business_subscription_id: string | null
          created_at: string
          customer_id: string
          deleted: boolean | null
          due_date: string
          external_reference: string | null
          failure_url: string | null
          fee_amount: number | null
          fine_value: number | null
          id: string
          installment: number | null
          interest_value: number | null
          invoice_url: string | null
          is_business: boolean | null
          net_amount: number | null
          next_due_date: string | null
          payment_cycle_id: string | null
          payment_date: string | null
          payment_date_limit: string | null
          payment_method: string | null
          redirect_url: string | null
          status: Database["public"]["Enums"]["asaas_payment_status"]
          subscription_id: string | null
          subscription_period: string | null
          subscription_type: string | null
          success_url: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          asaas_id: string
          asaas_payment_link?: string | null
          billing_type: string
          business_subscription_id?: string | null
          created_at?: string
          customer_id: string
          deleted?: boolean | null
          due_date: string
          external_reference?: string | null
          failure_url?: string | null
          fee_amount?: number | null
          fine_value?: number | null
          id?: string
          installment?: number | null
          interest_value?: number | null
          invoice_url?: string | null
          is_business?: boolean | null
          net_amount?: number | null
          next_due_date?: string | null
          payment_cycle_id?: string | null
          payment_date?: string | null
          payment_date_limit?: string | null
          payment_method?: string | null
          redirect_url?: string | null
          status?: Database["public"]["Enums"]["asaas_payment_status"]
          subscription_id?: string | null
          subscription_period?: string | null
          subscription_type?: string | null
          success_url?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          asaas_id?: string
          asaas_payment_link?: string | null
          billing_type?: string
          business_subscription_id?: string | null
          created_at?: string
          customer_id?: string
          deleted?: boolean | null
          due_date?: string
          external_reference?: string | null
          failure_url?: string | null
          fee_amount?: number | null
          fine_value?: number | null
          id?: string
          installment?: number | null
          interest_value?: number | null
          invoice_url?: string | null
          is_business?: boolean | null
          net_amount?: number | null
          next_due_date?: string | null
          payment_cycle_id?: string | null
          payment_date?: string | null
          payment_date_limit?: string | null
          payment_method?: string | null
          redirect_url?: string | null
          status?: Database["public"]["Enums"]["asaas_payment_status"]
          subscription_id?: string | null
          subscription_period?: string | null
          subscription_type?: string | null
          success_url?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_payments_business_subscription_id_fkey"
            columns: ["business_subscription_id"]
            isOneToOne: false
            referencedRelation: "business_plan_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "asaas_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_payments_payment_cycle_id_fkey"
            columns: ["payment_cycle_id"]
            isOneToOne: false
            referencedRelation: "gym_payout_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_transfer_batch: {
        Row: {
          created_at: string | null
          id: string
          processed_at: string | null
          reference_month: string
          status: string | null
          total_amount: number
          total_transfers: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed_at?: string | null
          reference_month: string
          status?: string | null
          total_amount: number
          total_transfers: number
        }
        Update: {
          created_at?: string | null
          id?: string
          processed_at?: string | null
          reference_month?: string
          status?: string | null
          total_amount?: number
          total_transfers?: number
        }
        Relationships: []
      }
      asaas_transfers: {
        Row: {
          academia_id: string
          amount: number
          asaas_id: string | null
          batch_id: string | null
          created_at: string
          fee_amount: number | null
          id: string
          net_amount: number | null
          processing_date: string | null
          reference_month: string
          scheduled_date: string | null
          status: string
          transfer_date: string | null
          updated_at: string
        }
        Insert: {
          academia_id: string
          amount: number
          asaas_id?: string | null
          batch_id?: string | null
          created_at?: string
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          processing_date?: string | null
          reference_month: string
          scheduled_date?: string | null
          status?: string
          transfer_date?: string | null
          updated_at?: string
        }
        Update: {
          academia_id?: string
          amount?: number
          asaas_id?: string | null
          batch_id?: string | null
          created_at?: string
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          processing_date?: string | null
          reference_month?: string
          scheduled_date?: string | null
          status?: string
          transfer_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_transfers_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_transfers_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "asaas_transfer_batch"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhook_events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          debug_info: Json | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
          retry_count: number | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          debug_info?: Json | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          debug_info?: Json | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      benefit_plans: {
        Row: {
          auto_renewal: boolean | null
          base_price: number | null
          business_id: string | null
          cancellation_rules: Json | null
          category_id: string | null
          check_in_rules: Json | null
          created_at: string
          description: string | null
          early_cancellation_fee: number | null
          employee_limit: number | null
          final_user_cost: number | null
          financing_rules: Json | null
          id: string
          late_payment_fee: number | null
          linked_plan_id: string | null
          minimum_contract_months: number | null
          monthly_cost: number
          name: string
          payment_methods: Json | null
          payment_rules: Json | null
          period_type: string
          plan_type: string
          platform_fee: number | null
          renewal_type: string | null
          rules: Json
          setup_fee: number | null
          status: string
          subsidy_amount: number | null
          updated_at: string
          user_final_cost: number | null
          validity_period: unknown | null
        }
        Insert: {
          auto_renewal?: boolean | null
          base_price?: number | null
          business_id?: string | null
          cancellation_rules?: Json | null
          category_id?: string | null
          check_in_rules?: Json | null
          created_at?: string
          description?: string | null
          early_cancellation_fee?: number | null
          employee_limit?: number | null
          final_user_cost?: number | null
          financing_rules?: Json | null
          id?: string
          late_payment_fee?: number | null
          linked_plan_id?: string | null
          minimum_contract_months?: number | null
          monthly_cost: number
          name: string
          payment_methods?: Json | null
          payment_rules?: Json | null
          period_type?: string
          plan_type?: string
          platform_fee?: number | null
          renewal_type?: string | null
          rules?: Json
          setup_fee?: number | null
          status?: string
          subsidy_amount?: number | null
          updated_at?: string
          user_final_cost?: number | null
          validity_period?: unknown | null
        }
        Update: {
          auto_renewal?: boolean | null
          base_price?: number | null
          business_id?: string | null
          cancellation_rules?: Json | null
          category_id?: string | null
          check_in_rules?: Json | null
          created_at?: string
          description?: string | null
          early_cancellation_fee?: number | null
          employee_limit?: number | null
          final_user_cost?: number | null
          financing_rules?: Json | null
          id?: string
          late_payment_fee?: number | null
          linked_plan_id?: string | null
          minimum_contract_months?: number | null
          monthly_cost?: number
          name?: string
          payment_methods?: Json | null
          payment_rules?: Json | null
          period_type?: string
          plan_type?: string
          platform_fee?: number | null
          renewal_type?: string | null
          rules?: Json
          setup_fee?: number | null
          status?: string
          subsidy_amount?: number | null
          updated_at?: string
          user_final_cost?: number | null
          validity_period?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "benefit_plans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "academia_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_plans_linked_plan_id_fkey"
            columns: ["linked_plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
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
            foreignKeyName: "benefit_usage_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      business_employees: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plan_subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_link: string | null
          business_id: string
          created_at: string
          end_date: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          plan_id: string
          start_date: string
          status: string
          total_value: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          business_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          plan_id: string
          start_date?: string
          status?: string
          total_value?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          business_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          total_value?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_plan_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_plan_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
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
      checkout_sessions: {
        Row: {
          created_at: string | null
          id: string
          payment_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "asaas_payments"
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
      employee_invites: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string
          id: string
          invite_token: string | null
          plan_id: string
          status: Database["public"]["Enums"]["employee_invite_status"] | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email: string
          id?: string
          invite_token?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["employee_invite_status"] | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          invite_token?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["employee_invite_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invites_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          birth_date: string | null
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
          birth_date?: string | null
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
          birth_date?: string | null
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
      financial_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          fee_amount: number | null
          id: string
          net_amount: number | null
          processed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          processed_at?: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: []
      }
      gym_check_ins: {
        Row: {
          academia_id: string
          access_token: string | null
          check_in_time: string | null
          check_out_time: string | null
          code: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          payout_cycle_id: string | null
          qr_code_id: string | null
          qr_data: Json | null
          status: string
          token_expires_at: string | null
          user_id: string
          validation_method: string
          valor_repasse: number | null
        }
        Insert: {
          academia_id: string
          access_token?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payout_cycle_id?: string | null
          qr_code_id?: string | null
          qr_data?: Json | null
          status?: string
          token_expires_at?: string | null
          user_id: string
          validation_method: string
          valor_repasse?: number | null
        }
        Update: {
          academia_id?: string
          access_token?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payout_cycle_id?: string | null
          qr_code_id?: string | null
          qr_data?: Json | null
          status?: string
          token_expires_at?: string | null
          user_id?: string
          validation_method?: string
          valor_repasse?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_check_ins_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_check_ins_payout_cycle_id_fkey"
            columns: ["payout_cycle_id"]
            isOneToOne: false
            referencedRelation: "gym_payout_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_check_ins_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "gym_qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_payout_cycles: {
        Row: {
          academia_id: string
          asaas_transfer_id: string | null
          check_ins_count: number
          created_at: string
          end_date: string | null
          id: string
          payout_date: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          academia_id: string
          asaas_transfer_id?: string | null
          check_ins_count?: number
          created_at?: string
          end_date?: string | null
          id?: string
          payout_date?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          academia_id?: string
          asaas_transfer_id?: string | null
          check_ins_count?: number
          created_at?: string
          end_date?: string | null
          id?: string
          payout_date?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_payout_cycles_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_payout_cycles_asaas_transfer_id_fkey"
            columns: ["asaas_transfer_id"]
            isOneToOne: false
            referencedRelation: "asaas_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_qr_codes: {
        Row: {
          academia_id: string
          code: string
          created_at: string | null
          expires_at: string
          id: string
          status: string
        }
        Insert: {
          academia_id: string
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          status?: string
        }
        Update: {
          academia_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_qr_codes_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
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
      plan_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          plan_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          plan_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "academia_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_categories_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
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
      plan_check_in_limits: {
        Row: {
          created_at: string
          daily_limit: number | null
          id: string
          monthly_limit: number | null
          plan_id: string | null
          updated_at: string
          weekly_limit: number | null
        }
        Insert: {
          created_at?: string
          daily_limit?: number | null
          id?: string
          monthly_limit?: number | null
          plan_id?: string | null
          updated_at?: string
          weekly_limit?: number | null
        }
        Update: {
          created_at?: string
          daily_limit?: number | null
          id?: string
          monthly_limit?: number | null
          plan_id?: string | null
          updated_at?: string
          weekly_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_check_in_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_payment_settings: {
        Row: {
          automatic_retry: boolean | null
          billing_type: string
          created_at: string | null
          due_day: number
          id: string
          max_retry_attempts: number | null
          plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          automatic_retry?: boolean | null
          billing_type?: string
          created_at?: string | null
          due_day?: number
          id?: string
          max_retry_attempts?: number | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          automatic_retry?: boolean | null
          billing_type?: string
          created_at?: string | null
          due_day?: number
          id?: string
          max_retry_attempts?: number | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_payment_settings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "benefit_plans"
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
      plan_volume_discounts: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          max_employees: number | null
          min_employees: number
          plan_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage: number
          id?: string
          max_employees?: number | null
          min_employees: number
          plan_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          max_employees?: number | null
          min_employees?: number
          plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_volume_discounts_plan_id_fkey"
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
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      transfer_rules: {
        Row: {
          academia_id: string | null
          automatic_transfer: boolean | null
          created_at: string | null
          id: string
          minimum_transfer_amount: number | null
          transfer_days: number[] | null
          updated_at: string | null
        }
        Insert: {
          academia_id?: string | null
          automatic_transfer?: boolean | null
          created_at?: string | null
          id?: string
          minimum_transfer_amount?: number | null
          transfer_days?: number[] | null
          updated_at?: string | null
        }
        Update: {
          academia_id?: string | null
          automatic_transfer?: boolean | null
          created_at?: string | null
          id?: string
          minimum_transfer_amount?: number | null
          transfer_days?: number[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_rules_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_settings: {
        Row: {
          auto_transfer: boolean | null
          created_at: string | null
          id: string
          minimum_transfer_amount: number
          transfer_day: number
          updated_at: string | null
        }
        Insert: {
          auto_transfer?: boolean | null
          created_at?: string | null
          id?: string
          minimum_transfer_amount?: number
          transfer_day?: number
          updated_at?: string | null
        }
        Update: {
          auto_transfer?: boolean | null
          created_at?: string | null
          id?: string
          minimum_transfer_amount?: number
          transfer_day?: number
          updated_at?: string | null
        }
        Relationships: []
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
          asaas_customer_id: string | null
          asaas_payment_link: string | null
          asaas_subscription_id: string | null
          created_at: string
          end_date: string | null
          id: string
          installments: number | null
          last_payment_date: string | null
          next_payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan_id: string
          proration_credit: number | null
          start_date: string
          status: Database["public"]["Enums"]["plan_subscription_status"]
          total_value: number | null
          updated_at: string
          upgrade_from_subscription_id: string | null
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          installments?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan_id: string
          proration_credit?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["plan_subscription_status"]
          total_value?: number | null
          updated_at?: string
          upgrade_from_subscription_id?: string | null
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          installments?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan_id?: string
          proration_credit?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["plan_subscription_status"]
          total_value?: number | null
          updated_at?: string
          upgrade_from_subscription_id?: string | null
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
          {
            foreignKeyName: "user_plan_subscriptions_upgrade_from_subscription_id_fkey"
            columns: ["upgrade_from_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_plan_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_types: {
        Row: {
          created_at: string
          id: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["user_role_type"]
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_types_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active: boolean
          birth_date: string | null
          cpf: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          phone_number?: string | null
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
      asaas_webhook_events_with_errors: {
        Row: {
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          event_id: string | null
          event_type: string | null
          id: string | null
          payload: Json | null
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
          retry_count: number | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string | null
          payload?: Json | null
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string | null
          payload?: Json | null
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_subscription: {
        Args: {
          p_subscription_id: string
        }
        Returns: Json
      }
      asaas_api: {
        Args: {
          action: string
          data: Json
        }
        Returns: Json
      }
      calculate_financial_metrics: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_revenue: number
          total_transfers: number
          total_fees: number
          net_revenue: number
        }[]
      }
      calculate_plan_proration: {
        Args: {
          current_plan_id: string
          new_plan_id: string
          current_subscription_id: string
        }
        Returns: {
          prorated_amount: number
          days_remaining: number
          credit_amount: number
        }[]
      }
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
      check_active_subscription: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      check_and_expire_plans: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_business_active_subscription: {
        Args: {
          p_business_id: string
        }
        Returns: boolean
      }
      check_employee_limit: {
        Args: {
          business_id: string
          plan_id: string
        }
        Returns: boolean
      }
      check_subscription_status: {
        Args: {
          p_subscription_id: string
        }
        Returns: {
          subscription_status: string
          payment_status: string
          last_event: string
          last_event_date: string
          payment_details: Json
          history: Json
        }[]
      }
      check_unprocessed_webhooks: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          event_type: string
          subscription_id: string
          payment_id: string
          status: string
          created_at: string
          error: string
        }[]
      }
      check_unprocessed_webhooks_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          event_type: string
          payment_id: string
          subscription_id: string
          status: string
          created_at: string
          error: string
        }[]
      }
      check_user_asaas_data: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      check_user_by_cpf: {
        Args: {
          p_cpf: string
        }
        Returns: string
      }
      complete_payout_cycle: {
        Args: {
          p_cycle_id: string
        }
        Returns: {
          academia_id: string
          asaas_transfer_id: string | null
          check_ins_count: number
          created_at: string
          end_date: string | null
          id: string
          payout_date: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
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
      create_checkout_session: {
        Args: {
          p_payment_id: string
          p_user_id: string
          p_success_url: string
          p_failure_url: string
        }
        Returns: string
      }
      generate_check_in_token: {
        Args: {
          p_user_id: string
          p_academia_id: string
        }
        Returns: {
          access_token: string
          expires_at: string
          can_check_in: boolean
          message: string
        }[]
      }
      generate_mobile_access_token: {
        Args: {
          p_user_id: string
          p_academia_id: string
        }
        Returns: {
          access_token: string
          expires_at: string
          can_check_in: boolean
          message: string
        }[]
      }
      get_active_access_token: {
        Args: {
          p_user_id: string
          p_academia_id: string
        }
        Returns: {
          access_token: string
          expires_at: string
          seconds_remaining: number
        }[]
      }
      get_asaas_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          environment: Database["public"]["Enums"]["payment_environment"]
          api_key: string
          api_url: string
        }[]
      }
      get_business_active_plans: {
        Args: {
          p_business_id: string
        }
        Returns: {
          subscription_id: string
          plan_id: string
          plan_name: string
          plan_type: string
          monthly_cost: number
          is_subsidized: boolean
          start_date: string
        }[]
      }
      get_complete_user_data: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      get_date_from_timestamp: {
        Args: {
          ts: string
        }
        Returns: string
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
      get_user_subsidized_plans: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          name: string
          description: string
          monthly_cost: number
          features: Json
          plan_type: string
          status: string
          business_id: string
          business_name: string
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_business_employee: {
        Args: {
          user_id: string
          business_id: string
        }
        Returns: boolean
      }
      is_gym_owner: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      link_asaas_subscription:
        | {
            Args: {
              p_user_id: string
              p_asaas_subscription_id: string
              p_plan_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              subscription_id: string
              asaas_subscription_id: string
            }
            Returns: Json
          }
      process_asaas_webhook: {
        Args: {
          payload: Json
        }
        Returns: Json
      }
      process_payment_webhook: {
        Args: {
          payload: Json
        }
        Returns: Json
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
      reprocess_failed_webhook_event: {
        Args: {
          webhook_event_id: string
        }
        Returns: Json
      }
      reprocess_failed_webhooks: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          event_type: string
          status: string
          error: string
          processed_at: string
        }[]
      }
      save_asaas_customer: {
        Args: {
          p_user_id: string
          p_asaas_id: string
          p_name: string
          p_email: string
          p_cpf_cnpj: string
        }
        Returns: string
      }
      sync_asaas_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_webhook_events_access: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_pending_plans_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_webhook_function: {
        Args: {
          table_name: string
        }
        Returns: undefined
      }
      validate_access_token: {
        Args: {
          p_token: string
          p_academia_id: string
        }
        Returns: {
          valid: boolean
          message: string
          user_id: string
          user_name: string
          check_in_id: string
        }[]
      }
      validate_check_in: {
        Args: {
          p_user_id: string
          p_academia_id: string
        }
        Returns: boolean
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
      validate_check_in_rules: {
        Args: {
          p_user_id: string
          p_academia_id: string
        }
        Returns: {
          can_check_in: boolean
          message: string
          valor_repasse: number
          plano_id: string
          valor_plano: number
          p_num_checkins: number
          remaining_daily: number
          remaining_weekly: number
          remaining_monthly: number
        }[]
      }
      validate_gym_check_in:
        | {
            Args: {
              p_user_id: string
              p_academia_id: string
              p_qr_code: string
            }
            Returns: {
              success: boolean
              message: string
              check_in_id: string
            }[]
          }
        | {
            Args: {
              p_user_id: string
              p_academia_id: string
              p_qr_code: string
              p_validation_method?: string
            }
            Returns: {
              success: boolean
              message: string
              check_in_id: string
            }[]
          }
    }
    Enums: {
      asaas_payment_status:
        | "PENDING"
        | "RECEIVED"
        | "CONFIRMED"
        | "OVERDUE"
        | "REFUNDED"
        | "RECEIVED_IN_CASH"
        | "REFUND_REQUESTED"
        | "CHARGEBACK_REQUESTED"
        | "CHARGEBACK_DISPUTE"
        | "AWAITING_CHARGEBACK_REVERSAL"
        | "DUNNING_REQUESTED"
        | "CANCELED"
      check_in_validation_method: "qr_code" | "manual_code" | "qr_scan"
      employee_invite_status: "pending" | "accepted" | "rejected"
      entity_type: "user" | "business" | "academia" | "system"
      gym_role: "gym_owner" | "gym_admin" | "gym_staff"
      payment_environment: "sandbox" | "production"
      payment_method:
        | "credit_card"
        | "debit_card"
        | "pix"
        | "boleto"
        | "transfer"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
        | "processing"
      plan_subscription_status: "active" | "pending" | "expired" | "cancelled"
      transaction_type: "payment" | "refund" | "transfer" | "fee" | "adjustment"
      user_role_type:
        | "individual"
        | "business"
        | "gym"
        | "admin"
        | "gym_owner"
        | "app_user"
    }
    CompositeTypes: {
      http_header: {
        field: unknown | null
        value: string | null
      }
      http_request: {
        method: string | null
        uri: string | null
        headers: unknown[] | null
        content_type: string | null
        content: string | null
      }
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
