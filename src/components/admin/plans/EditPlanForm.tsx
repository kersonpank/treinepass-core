import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updatePlan } from "@/services/plans";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MultipleSelect, TTag } from "@/components/ui/multiple-select";

interface Plan {
  id: string;
  name: string;
  description?: string;
  monthly_cost: string;
  plan_type: "corporate" | "individual" | "corporate_subsidized";
  period_type: "monthly" | "quarterly" | "semiannual" | "annual";
  status: "active" | "inactive";
  rules: Record<string, any>;
  subsidy_amount?: number;
  final_user_cost?: number;
  category_ids?: string[];
}

interface EditPlanFormProps {
  plan: Plan;
  onSuccess: () => void;
}

export function EditPlanForm({ plan, onSuccess }: EditPlanFormProps) {
  const [planData, setPlanData] = useState(plan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_categorias")
        .select("*")
        .eq("active", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch current plan categories
  const { data: planCategories } = useQuery({
    queryKey: ["plan-categories", plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_categories")
        .select("category_id")
        .eq("plan_id", plan.id);

      if (error) throw error;
      return data.map(pc => pc.category_id);
    },
  });

  useEffect(() => {
    if (planCategories) {
      setPlanData(prev => ({
        ...prev,
        category_ids: planCategories
      }));
    }
  }, [planCategories]);

  const categoryTags: TTag[] = categories?.map(cat => ({
    key: cat.id,
    name: cat.nome
  })) || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlanData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updatePlan(plan.id, planData);

      // Update plan categories
      if (planData.category_ids) {
        // Remove existing categories
        await supabase
          .from("plan_categories")
          .delete()
          .eq("plan_id", plan.id);

        // Add new categories
        const planCategories = planData.category_ids.map(categoryId => ({
          plan_id: plan.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from("plan_categories")
          .insert(planCategories);

        if (categoriesError) throw categoriesError;
      }

      toast({
        title: "Plano atualizado",
        description: "O plano foi atualizado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao salvar o plano",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Plano</Label>
        <Input
          id="name"
          name="name"
          value={planData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          value={planData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="categories">Categorias</Label>
        <MultipleSelect
          tags={categoryTags}
          onChange={(selected) => setPlanData(prev => ({ ...prev, category_ids: selected.map(s => s.key) }))}
          defaultValue={categoryTags.filter(tag => planData.category_ids?.includes(tag.key))}
        />
      </div>

      <div>
        <Label htmlFor="monthly_cost">Custo Mensal</Label>
        <Input
          id="monthly_cost"
          name="monthly_cost"
          type="number"
          value={planData.monthly_cost}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="plan_type">Tipo de Plano</Label>
        <Input
          id="plan_type"
          name="plan_type"
          value={planData.plan_type}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="period_type">Tipo de Período</Label>
        <Input
          id="period_type"
          name="period_type"
          value={planData.period_type}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Input
          id="status"
          name="status"
          value={planData.status}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="subsidy_amount">Valor do Subsídio</Label>
        <Input
          id="subsidy_amount"
          name="subsidy_amount"
          type="number"
          value={planData.subsidy_amount}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="final_user_cost">Custo Final para o Usuário</Label>
        <Input
          id="final_user_cost"
          name="final_user_cost"
          type="number"
          value={planData.final_user_cost}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
