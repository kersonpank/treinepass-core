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

interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_cost: number;
  plan_type: string;
  status: string;
}

export function PlansList() {
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
              <TableHead>Custo Mensal</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell>R$ {plan.monthly_cost.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={plan.status === "active" ? "success" : "destructive"}
                  >
                    {plan.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}