import { useState } from "react";
import { useSubscriptionCreation } from "./useSubscriptionCreation";
import { useUpgradePlan } from "./useUpgradePlan";
import { usePlanCancellation } from "./usePlanCancellation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsePlanSubscriptionsProps {
  userProfile: any;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  plan_type: string;
}

interface RawPlan {
  id: string;
  name: string;
  description: string;
  monthly_cost: number;
  rules: string[];
  plan_type: string;
}

export function usePlanSubscriptions() {
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data: rawPlans, error } = await supabase
        .from("benefit_plans")
        .select(`
          id,
          name,
          description,
          monthly_cost,
          rules,
          plan_type
        `)
        .eq("is_active", true)
        .order("monthly_cost");

      if (error) {
        console.error("Error fetching plans:", error);
        throw error;
      }

      return (rawPlans as RawPlan[]).map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.monthly_cost,
        features: plan.rules,
        plan_type: plan.plan_type
      }));
    }
  });

  return {
    plans,
    isLoading
  };
}
