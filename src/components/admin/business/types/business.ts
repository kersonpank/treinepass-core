
export interface Business {
  id: string;
  company_name: string;
  cnpj: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  number_of_employees: number;
  status: string;
  business_plan_subscriptions?: {
    id: string;
    status: string;
    start_date: string;
    end_date?: string;
    benefit_plans?: {
      id: string;
      name: string;
      status: string;
      financing_rules?: {
        type: string;
        contribution_type: string;
        company_contribution: number;
        employee_contribution: number;
      };
    };
  }[];
}
