
import { supabase } from "@/integrations/supabase/client";
import { AddEmployeeForm } from "./types";

export async function createEmployee(data: AddEmployeeForm, businessId: string) {
  console.log("Creating employee:", { data, businessId });

  // Verificar se o colaborador já existe para esta empresa
  const { data: existingEmployee } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", businessId)
    .eq("cpf", data.cpf);

  if (existingEmployee?.length > 0) {
    throw new Error("Colaborador já cadastrado para esta empresa");
  }

  // Criar colaborador
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .insert({
      business_id: businessId,
      full_name: data.name,
      cpf: data.cpf,
      birth_date: data.birth_date,
      department: data.department || null,
      cost_center: data.costCenter || null,
      status: "active"
    })
    .select()
    .single();

  if (employeeError) {
    console.error("Error creating employee:", employeeError);
    throw new Error("Erro ao criar colaborador");
  }

  // Se tem plano selecionado, vincular ao benefício
  if (data.planId) {
    const { error: benefitError } = await supabase
      .from("employee_benefits")
      .insert({
        employee_id: employee.id,
        plan_id: data.planId,
        status: "active",
        start_date: new Date().toISOString().split('T')[0]
      });

    if (benefitError) {
      console.error("Error adding employee benefit:", benefitError);
      throw new Error("Erro ao vincular plano ao colaborador");
    }
  }

  return employee;
}
