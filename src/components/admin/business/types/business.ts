
export interface Business {
  id: string;
  user_id: string;
  company_name: string;
  cnpj: string;
  trading_name: string | null;
  phone: string;
  email: string;
  address: string;
  number_of_employees: number;
  industry: string | null;
  contact_person: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
  status: string;
  created_at: string;
  updated_at: string;
  inscricao_estadual: string | null;
  telefone_secundario: string | null;
  plano_tipo: string | null;
  plano_modalidade: string | null;
  plano_pagamento_dia: number | null;
  documentos: any;
  termos_aceitos: boolean | null;
  data_termos_aceitos: string | null;
  business_plan_subscriptions?: Array<{
    status: string;
    start_date?: string;
    end_date?: string | null;
    benefit_plans?: {
      name: string;
    };
  }>;
  employees?: Array<{
    id: string;
    full_name: string;
    email: string;
    cpf: string;
    birth_date: string | null;
    department: string | null;
    cost_center: string | null;
    status: string;
  }>;
}
