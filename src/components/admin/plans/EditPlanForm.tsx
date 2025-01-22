import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updatePlan } from "@/services/plans";

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
}

interface EditPlanFormProps {
  plan: Plan;
  onSuccess: () => void;
}

export function EditPlanForm({ plan, onSuccess }: EditPlanFormProps) {
  const [planData, setPlanData] = useState(plan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlanData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updatePlan(plan.id, {
        name: planData.name,
        description: planData.description,
        monthly_cost: planData.monthly_cost,
        plan_type: planData.plan_type,
        period_type: planData.period_type,
        status: planData.status,
        rules: planData.rules,
        subsidy_amount: Number(planData.subsidy_amount),
        final_user_cost: Number(planData.final_user_cost)
      });

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