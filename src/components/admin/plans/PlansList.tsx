import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_cost: number;
  plan_type: string;
  period_type: string;
  status: string;
  rules: Record<string, any>;
}

interface PlansListProps {
  onEditPlan: (planId: string) => void;
}

const periodTypeLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export function PlansList({ onEditPlan }: PlansListProps) {
  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Plan[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Periodicidade</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.description || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {plan.plan_type === "corporate" ? "Corporativo" : "Individual"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {periodTypeLabels[plan.period_type]}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(plan.monthly_cost)}</TableCell>
                <TableCell>
                  <Badge
                    variant={plan.status === "active" ? "default" : "destructive"}
                  >
                    {plan.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditPlan(plan.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}