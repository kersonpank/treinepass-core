
import { supabase } from "@/integrations/supabase/client";
import { AddEmployeeForm } from "./types";

export async function createEmployee(data: AddEmployeeForm, businessId: string) {
  console.log("Creating employee:", { data, businessId });

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
    console.error("Error creating employee:", employeeError);
    throw employeeError;
  }

  console.log("Employee created:", employeeData);
  return employeeData;
}

export async function addEmployeeBenefit(employeeId: string, planId: string) {
  console.log("Adding employee benefit:", { employeeId, planId });

  const { error: benefitError } = await supabase
    .from("employee_benefits")
    .insert({
      employee_id: employeeId,
      plan_id: planId,
      start_date: new Date().toISOString().split('T')[0],
      status: "active"
    });

  if (benefitError) {
    console.error("Error adding employee benefit:", benefitError);
    throw benefitError;
  }

  console.log("Employee benefit added successfully");
}

export async function checkExistingProfile(email: string) {
  console.log("Checking existing profile for:", email);

  const { data: existingProfile, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error checking existing profile:", error);
    throw error;
  }

  console.log("Existing profile check result:", existingProfile);
  return existingProfile;
}

export async function sendEmployeeInvite(businessId: string, planId: string, email: string) {
  console.log("Sending employee invite:", { businessId, planId, email });

  const { error: inviteError } = await supabase
    .from("employee_invites")
    .insert({
      business_id: businessId,
      plan_id: planId,
      email: email,
      status: "pending"
    });

  if (inviteError) {
    console.error("Error sending employee invite:", inviteError);
    throw inviteError;
  }

  console.log("Employee invite sent successfully");
}

export async function sendInviteEmail(employeeName: string, employeeEmail: string, companyName: string) {
  console.log("Sending invite email:", { employeeName, employeeEmail, companyName });

  const { data, error } = await supabase.functions.invoke('send-employee-invite', {
    body: {
      employeeName,
      employeeEmail,
      companyName
    }
  });

  if (error) {
    console.error("Error sending invite email:", error);
    throw error;
  }

  console.log("Invite email sent successfully:", data);
  return data;
}

export async function resendInvite(email: string, businessId: string) {
  console.log("Resending invite:", { email, businessId });

  // Get employee data
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
    console.error("Error getting employee data:", employeeError);
    throw new Error("Colaborador não encontrado");
  }

  // Get company name
  const { data: business, error: businessError } = await supabase
    .from("business_profiles")
    .select("company_name")
    .eq("id", businessId)
    .single();

  if (businessError) {
    console.error("Error getting business data:", businessError);
    throw new Error("Empresa não encontrada");
  }

  // Resend invite
  await sendInviteEmail(
    employee.full_name,
    employee.email,
    business.company_name
  );

  // Update employee_invites table
  await sendEmployeeInvite(
    businessId, 
    employee.employee_benefits[0].plan_id,
    email
  );

  console.log("Invite resent successfully");
}
