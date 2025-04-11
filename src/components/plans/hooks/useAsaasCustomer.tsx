
import { supabase } from "@/integrations/supabase/client";

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

export async function findOrCreateAsaasCustomer(
  userId: string,
  profileData?: any
): Promise<{ asaasCustomerId: string, customerId: string }> {
  try {
    // First check if customer already exists in our database
    const { data: existingCustomer, error: customerError } = await supabase
      .from("asaas_customers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingCustomer?.asaas_id) {
      console.log("Customer already exists in our database:", existingCustomer);
      return {
        asaasCustomerId: existingCustomer.asaas_id,
        customerId: existingCustomer.id
      };
    }

    // If not found, we need to collect user data to create a customer in Asaas
    let userData: CustomerData;

    if (profileData) {
      // If profile data was provided (for business customers)
      userData = {
        name: profileData.company_name || profileData.full_name || "Cliente",
        email: profileData.email || profileData.contact_email || "cliente@exemplo.com",
        cpfCnpj: profileData.cnpj || profileData.cpf || "12345678909",
        mobilePhone: profileData.phone || profileData.contact_phone || profileData.telefone,
        phone: profileData.phone || profileData.contact_phone || profileData.telefone,
        address: profileData.address || profileData.endereco,
        postalCode: profileData.postal_code || profileData.cep
      };
    } else {
      // Fetch user data from profile and auth
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Get auth user data for fallback
      userData = {
        name: userProfile?.full_name || user?.user_metadata?.full_name || "Cliente",
        email: userProfile?.email || user?.email || "cliente@exemplo.com",
        cpfCnpj: userProfile?.cpf || user?.user_metadata?.cpf || "12345678909",
        mobilePhone: userProfile?.phone || user?.user_metadata?.phone,
        phone: userProfile?.phone || user?.phone_number || user?.user_metadata?.phone,
        address: userProfile?.address || user?.user_metadata?.address,
        postalCode: userProfile?.postal_code || user?.user_metadata?.postal_code
      };
    }

    // Make sure cpfCnpj is clean (no special characters)
    userData.cpfCnpj = userData.cpfCnpj?.replace(/[^\d]/g, '') || "12345678909";
    
    console.log("Creating Asaas customer with data:", userData);

    // Create customer in Asaas
    const { data: asaasResponse, error } = await supabase.functions.invoke(
      'asaas-api',
      {
        body: {
          action: "createCustomer",
          data: userData
        }
      }
    );

    if (error || !asaasResponse?.id) {
      console.error("Error creating Asaas customer:", error || asaasResponse);
      throw new Error(`Erro ao criar cliente no Asaas: ${error?.message || 'Resposta inválida'}`);
    }

    console.log("Asaas customer created:", asaasResponse);

    // Save customer data in our database
    const { data: newCustomer, error: saveError } = await supabase
      .from("asaas_customers")
      .insert({
        user_id: userId,
        asaas_id: asaasResponse.id,
        name: userData.name,
        email: userData.email,
        cpf_cnpj: userData.cpfCnpj
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving customer data:", saveError);
      throw new Error(`Erro ao salvar dados do cliente: ${saveError.message}`);
    }

    return {
      asaasCustomerId: asaasResponse.id,
      customerId: newCustomer.id
    };
  } catch (error: any) {
    console.error("Error in findOrCreateAsaasCustomer:", error);
    throw error;
  }
}
