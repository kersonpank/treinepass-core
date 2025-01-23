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
import { Edit2, Eye, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plan } from "./types/plan";

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
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((plan): Plan => ({
        ...plan,
        monthly_cost: plan.monthly_cost.toString(),
        status: plan.status as Plan["status"],
        plan_type: plan.plan_type as Plan["plan_type"],
        period_type: plan.period_type as Plan["period_type"],
        rules: plan.rules as Record<string, any>,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos Cadastrados</CardTitle>
        <CardDescription>
          Gerencie os planos disponíveis no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan) => (
                <TableRow key={plan.id} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {plan.plan_type === "corporate" ? "Corporativo" : 
                       plan.plan_type === "corporate_subsidized" ? "Corporativo Subsidiado" : 
                       "Individual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {periodTypeLabels[plan.period_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(plan.monthly_cost))}</TableCell>
                  <TableCell>
                    <Badge
                      variant={plan.status === "active" ? "default" : "destructive"}
                      className="capitalize"
                    >
                      {plan.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditPlan(plan.id)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}