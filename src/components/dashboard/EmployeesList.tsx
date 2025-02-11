
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { AddEmployeeDialog } from "@/components/business/employees/AddEmployeeDialog";

export function EmployeesList() {
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: businessProfile } = useQuery({
    queryKey: ["businessProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", search, businessProfile?.id],
    enabled: !!businessProfile?.id,
    queryFn: async () => {
      if (!businessProfile?.id) return [];

      const query = supabase
        .from("employees")
        .select(`
          *,
          employee_benefits!inner (
            plan_id,
            status,
            benefit_plans (
              name,
              financing_rules
            )
          )
        `)
        .eq("business_id", businessProfile.id)
        .order("full_name");

      if (search) {
        query.ilike("full_name", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Colaborador
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.full_name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.department || "-"}</TableCell>
                <TableCell>{employee.cost_center || "-"}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    employee.status === "active" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {employee.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  {employee.employee_benefits?.map((benefit) => (
                    <div key={benefit.plan_id} className="space-y-1">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                        {benefit.benefit_plans.name}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {benefit.status === "active" ? "Plano ativo" : "Plano inativo"}
                      </span>
                    </div>
                  ))}
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

      {businessProfile && (
        <AddEmployeeDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          businessId={businessProfile.id}
        />
      )}
    </div>
  );
}
