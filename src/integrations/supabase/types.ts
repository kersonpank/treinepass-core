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
          email: string
          id: string
          industry: string | null
          number_of_employees: number
          phone: string
          status: string
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
          email: string
          id?: string
          industry?: string | null
          number_of_employees: number
          phone: string
          status?: string
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
          email?: string
          id?: string
          industry?: string | null
          number_of_employees?: number
          phone?: string
          status?: string
          trading_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      [_ in never]: never
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
