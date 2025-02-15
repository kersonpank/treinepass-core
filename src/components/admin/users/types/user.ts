
export interface UserType {
  type: string;
}

export interface UserPlanSubscription {
  status: string;
  start_date: string;
  end_date: string | null;
  benefit_plans: {
    name: string;
  };
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  birth_date: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  active: boolean;
  user_profile_types?: UserType[];
  user_plan_subscriptions?: UserPlanSubscription[];
}
