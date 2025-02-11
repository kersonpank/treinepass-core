
import { supabase } from "@/integrations/supabase/client";
import { AddEmployeeForm } from "./types";

export async function createEmployee(data: AddEmployeeForm, businessId: string) {
  const { data: employeeData, error: employeeError } = await supabase
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
    throw employeeError;
  }

  return employeeData;
}

export async function addEmployeeBenefit(employeeId: string, planId: string) {
  const { error: benefitError } = await supabase
    .from("employee_benefits")
    .insert({
      employee_id: employeeId,
      plan_id: planId,
      start_date: new Date().toISOString(),
      status: "active"
    });

  if (benefitError) {
    throw benefitError;
  }
}

export async function checkExistingProfile(email: string) {
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .single();

  return existingProfile;
}

export async function sendEmployeeInvite(businessId: string, planId: string, email: string) {
  const { error: inviteError } = await supabase
    .from("employee_invites")
    .insert({
      business_id: businessId,
      plan_id: planId,
      email: email
    });

  if (inviteError) {
    throw inviteError;
  }
}
