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
import { useToast } from "@/hooks/use-toast";

interface PlansListProps {
  onEditPlan: (plan: Plan) => void;
  onViewPlan: (plan: Plan) => void;
}

const periodTypeLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export function PlansList({ onEditPlan, onViewPlan }: PlansListProps) {
  const { toast } = useToast();
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((plan) => ({
        id: plan.id,
        status: plan.status,
        name: plan.name,
        description: plan.description,
        monthly_cost: plan.monthly_cost,
        annual_discount: plan.annual_discount,
        corporate_discount: plan.corporate_discount,
        validity_period: plan.validity_period,
        plan_type: plan.plan_type as Plan["plan_type"],
        period_type: plan.period_type as Plan["period_type"],
        renewal_type: (plan.renewal_type || "automatic") as Plan["renewal_type"],
        rules: plan.rules ? (typeof plan.rules === 'object' ? plan.rules : {}) : {}, 
        payment_rules: plan.payment_rules 
          ? (typeof plan.payment_rules === 'object' ? plan.payment_rules : { continue_without_use: true }) 
          : { continue_without_use: true },
      }));
    },
  });

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("benefit_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir plano",
        description: "Não foi possível excluir o plano. Tente novamente.",
      });
    }
  };

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
                  <TableCell>
                    <div className="space-y-1">
                      <div>{formatCurrency(Number(plan.monthly_cost))}</div>
                      {plan.base_price && (
                        <div className="text-xs text-muted-foreground">
                          Base: {formatCurrency(plan.base_price)}
                        </div>
                      )}
                      {plan.platform_fee && (
                        <div className="text-xs text-muted-foreground">
                          Taxa: {plan.platform_fee}%
                        </div>
                      )}
                    </div>
                  </TableCell>
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
                        onClick={() => onEditPlan(plan)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewPlan(plan)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePlan(plan.id)}
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
