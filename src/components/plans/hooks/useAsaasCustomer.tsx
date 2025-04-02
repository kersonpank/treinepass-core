
import { supabase } from "@/integrations/supabase/client";

export async function findOrCreateAsaasCustomer(userId: string, profile: any) {
  try {
    // Check if customer already exists
    const { data: existingCustomer, error: customerError } = await supabase
      .from("asaas_customers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (customerError && customerError.code !== "PGRST116") {
      throw customerError;
    }

    // If customer exists, return it
    if (existingCustomer) {
      return { 
        asaasCustomerId: existingCustomer.asaas_id,
        customerId: existingCustomer.id
      };
    }

    // Create new customer in Asaas
    const { data: customerData, error: createCustomerError } = await supabase.functions.invoke(
      'asaas-api',
      {
        body: {
          action: "createCustomer",
          data: {
            name: profile.company_name || profile.full_name,
            email: profile.email,
            cpfCnpj: profile.cnpj || profile.cpf
          }
        }
      }
    );

    if (createCustomerError || !customerData?.id) {
      throw new Error(`Erro ao criar cliente no Asaas: ${createCustomerError?.message || "Resposta inválida"}`);
    }

    // Save customer data in our database
    const { data: newCustomer, error: saveCustomerError } = await supabase
      .from("asaas_customers")
      .insert({
        user_id: userId,
        asaas_id: customerData.id,
        name: profile.company_name || profile.full_name,
        email: profile.email,
        cpf_cnpj: profile.cnpj || profile.cpf,
        business_id: profile.id
      })
      .select()
      .single();

    if (saveCustomerError) {
      throw saveCustomerError;
    }

    return { 
      asaasCustomerId: customerData.id,
      customerId: newCustomer.id
    };
  } catch (error) {
    console.error("Error creating/finding Asaas customer:", error);
    throw error;
  }
}
