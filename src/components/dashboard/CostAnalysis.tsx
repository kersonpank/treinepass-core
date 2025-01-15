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

export function CostAnalysis() {
  const { data: costs } = useQuery({
    queryKey: ["costAnalysis"],
    queryFn: async () => {
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("id")
        .single();

      if (!businessProfile) throw new Error("Business profile not found");

      const { data, error } = await supabase
        .from("employees")
        .select(`
          department,
          cost_center,
          employee_benefits (
            plan_id,
            benefit_plans (
              name,
              monthly_cost
            )
          )
        `)
        .eq("business_id", businessProfile.id)
        .eq("status", "active");

      if (error) throw error;

      // Agrupa custos por centro de custo
      const costsByCenter = data.reduce((acc, employee) => {
        const costCenter = employee.cost_center || "Sem Centro de Custo";
        const department = employee.department || "Sem Departamento";
        
        if (!acc[costCenter]) {
          acc[costCenter] = {
            costCenter,
            department,
            totalCost: 0,
            employeeCount: 0,
          };
        }

        acc[costCenter].employeeCount++;
        employee.employee_benefits?.forEach((benefit) => {
          if (benefit.benefit_plans) {
            acc[costCenter].totalCost += Number(benefit.benefit_plans.monthly_cost);
          }
        });

        return acc;
      }, {});

      return Object.values(costsByCenter);
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Análise de Custos</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Colaboradores</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead>Custo Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs?.map((cost) => (
              <TableRow key={cost.costCenter}>
                <TableCell>{cost.costCenter}</TableCell>
                <TableCell>{cost.department}</TableCell>
                <TableCell>{cost.employeeCount}</TableCell>
                <TableCell>R$ {cost.totalCost.toFixed(2)}</TableCell>
                <TableCell>
                  R$ {(cost.totalCost / cost.employeeCount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}