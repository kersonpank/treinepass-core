import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function BenefitPlans() {
  const { data: plans } = useQuery({
    queryKey: ["benefitPlans"],
    queryFn: async () => {
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("id")
        .single();

      if (!businessProfile) throw new Error("Business profile not found");

      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .or("plan_type.eq.corporate,plan_type.eq.corporate_subsidized")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Planos Corporativos</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Plano
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Custo Mensal</TableHead>
              <TableHead>Limite de Funcionários</TableHead>
              <TableHead>Subsídio</TableHead>
              <TableHead>Custo Final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{plan.description || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {plan.plan_type === "corporate" ? "Corporativo" : "Corporativo Subsidiado"}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(plan.monthly_cost)}</TableCell>
                <TableCell>
                  {plan.employee_limit ? `${plan.employee_limit} funcionários` : "Ilimitado"}
                </TableCell>
                <TableCell>
                  {plan.plan_type === 'corporate_subsidized' 
                    ? formatCurrency(plan.subsidy_amount || 0)
                    : "-"}
                </TableCell>
                <TableCell>
                  {plan.plan_type === 'corporate_subsidized'
                    ? formatCurrency(plan.user_final_cost || 0)
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={plan.status === "active" ? "default" : "secondary"}
                  >
                    {plan.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}