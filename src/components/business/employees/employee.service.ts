
import { supabase } from "@/integrations/supabase/client";
import { AddEmployeeForm } from "./types";

export async function createEmployee(data: AddEmployeeForm, businessId: string) {
  console.log("Creating employee:", { data, businessId });

  // Buscar plano atual da empresa
  const { data: businessPlan, error: planError } = await supabase
    .from("business_plan_subscriptions")
    .select(`
      *,
      benefit_plans!inner (
        employee_limit,
        name
      )
    `)
    .eq("business_id", businessId)
    .eq("status", "active")
    .single();

  if (planError) {
    console.error("Error fetching business plan:", planError);
    throw new Error("Erro ao verificar plano da empresa");
  }

  if (!businessPlan) {
    throw new Error("Empresa não possui plano ativo");
  }

  // Verificar limite de colaboradores
  const { count: currentEmployeesCount, error: countError } = await supabase
    .from("employees")
    .select("*", { count: true })
    .eq("business_id", businessId)
    .eq("status", "active");

  if (countError) {
    console.error("Error counting employees:", countError);
    throw new Error("Erro ao verificar quantidade de colaboradores");
  }

  const employeeLimit = businessPlan.benefit_plans.employee_limit;
  if (employeeLimit && currentEmployeesCount >= employeeLimit) {
    throw new Error(`Limite de ${employeeLimit} colaboradores atingido no plano ${businessPlan.benefit_plans.name}`);
  }

  // Criar colaborador
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .insert({
      business_id: businessId,
      email: data.email,
      full_name: data.name,
      cpf: data.cpf,
      department: data.department || null,
      cost_center: data.costCenter || null,
      status: "active"
    })
    .select()
    .single();

  if (employeeError) {
    console.error("Error creating employee:", employeeError);
    if (employeeError.code === '23505') {
      throw new Error("CPF ou email já cadastrado para esta empresa");
    }
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

  console.log("Employee created successfully:", employee);
  return employee;
}

export async function resendInvite(email: string, businessId: string) {
  console.log("Resending invite:", { email, businessId });

  // Buscar dados da empresa
  const { data: business, error: businessError } = await supabase
    .from("business_profiles")
    .select("company_name")
    .eq("id", businessId)
    .single();

  if (businessError) {
    console.error("Error fetching business:", businessError);
    throw new Error("Erro ao buscar dados da empresa");
  }

  // Buscar benefícios do colaborador
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(`
      *,
      employee_benefits!inner (
        plan_id
      )
    `)
    .eq("email", email)
    .eq("business_id", businessId)
    .single();

  if (employeeError) {
    console.error("Error fetching employee:", employeeError);
    throw new Error("Colaborador não encontrado");
  }

  // Enviar convite
  try {
    await sendInviteEmail(
      employee.full_name,
      email,
      business.company_name
    );
  } catch (error) {
    console.error("Error sending invite:", error);
    throw new Error("Erro ao enviar convite");
  }
}

export async function sendInviteEmail(employeeName: string, employeeEmail: string, companyName: string) {
  // Invocar edge function de envio de email
  const { error } = await supabase.functions.invoke('send-employee-invite', {
    body: { employeeName, employeeEmail, companyName }
  });

  if (error) {
    console.error("Error sending invite email:", error);
    throw error;
  }
}
