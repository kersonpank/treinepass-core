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

export function UsageReports() {
  const { data: usage } = useQuery({
    queryKey: ["usageReports"],
    queryFn: async () => {
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("id")
        .single();

      if (!businessProfile) throw new Error("Business profile not found");

      const { data, error } = await supabase
        .from("benefit_usage")
        .select(`
          *,
          employees (
            full_name,
            department,
            cost_center
          ),
          academias (
            nome
          )
        `)
        .in(
          "employee_id",
          supabase
            .from("employees")
            .select("id")
            .eq("business_id", businessProfile.id)
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Relatório de Utilização</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Academia</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage?.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.employees?.full_name}</TableCell>
                <TableCell>{entry.employees?.department || "-"}</TableCell>
                <TableCell>{entry.employees?.cost_center || "-"}</TableCell>
                <TableCell>{entry.academias?.nome}</TableCell>
                <TableCell>
                  {new Date(entry.check_in).toLocaleString()}
                </TableCell>
                <TableCell>
                  {entry.check_out 
                    ? new Date(entry.check_out).toLocaleString() 
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}