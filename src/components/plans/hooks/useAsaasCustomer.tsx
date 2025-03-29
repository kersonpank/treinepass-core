
import { supabase } from "@/integrations/supabase/client";

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_email?: string;
  cnpj: string;
}

export async function findOrCreateAsaasCustomer(userId: string, businessProfile: BusinessProfile) {
  // Verificar se o usuário já tem um cliente Asaas
  const { data: existingCustomer, error: customerError } = await supabase
    .from("asaas_customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (customerError && customerError.code !== "PGRST116") {
    throw customerError;
  }

  let asaasCustomerId = existingCustomer?.asaas_id;

  // Se não existir, criar um novo cliente no Asaas
  if (!asaasCustomerId) {
    const { data: customerData, error: createCustomerError } = await supabase.functions.invoke(
      'asaas-api',
      {
        body: {
          action: "createCustomer",
          data: {
            name: businessProfile.company_name,
            email: businessProfile.contact_email || '', // Garantir que há um valor, mesmo que vazio
            cpfCnpj: businessProfile.cnpj
          }
        }
      }
    );

    if (createCustomerError || !customerData?.id) {
      throw new Error(`Erro ao criar cliente no Asaas: ${createCustomerError?.message || "Resposta inválida"}`);
    }

    // Save customer data
    const { error: saveCustomerError } = await supabase
      .from("asaas_customers")
      .insert({
        user_id: userId,
        asaas_id: customerData.id,
        name: businessProfile.company_name,
        email: businessProfile.contact_email || '',
        cpf_cnpj: businessProfile.cnpj
      });

    if (saveCustomerError) {
      throw saveCustomerError;
    }

    asaasCustomerId = customerData.id;
  }

  return { 
    asaasCustomerId, 
    customerId: existingCustomer?.id 
  };
}
