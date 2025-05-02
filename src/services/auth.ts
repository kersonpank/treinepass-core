import { supabase } from "@/integrations/supabase/client";
import { normalizePhoneNumber, normalizeCpfCnpj } from "@/utils/formatters";

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
  phone: string;
}

import { PaymentGatewayType } from "@/types/system-settings";
// importação removida: createMercadoPagoCustomer agora é chamada via API backend

export async function registerUser(data: RegisterData) {
  console.log("Starting user registration process...", { email: data.email });

  // 1. Check if there's already a profile with this CPF
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("cpf", data.cpf.replace(/\D/g, ""))
    .maybeSingle();

  if (existingProfile) {
    throw new Error("CPF já cadastrado");
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    let userId;

    if (existingUser.user) {
      // User exists, use existing ID
      userId = existingUser.user.id;
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) {
        console.error("Auth Error:", authError);
        throw authError;
      }

      userId = authData.user?.id;
    }

    if (!userId) {
      console.error("No user ID returned from auth signup/signin");
      throw new Error("Erro ao criar/encontrar usuário");
    }

    console.log("Auth user created/found successfully", { userId });

    try {
      // Convert date from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = data.birth_date.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // 1. Consultar gateway de pagamento ativo
      let activeGateway: PaymentGatewayType = 'asaas';
      try {
        const { data: gatewayData, error: gatewayError } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'active_payment_gateway')
          .maybeSingle();
        if (!gatewayError && gatewayData?.value?.active_gateway) {
          activeGateway = gatewayData.value.active_gateway;
        }
      } catch (e) {
        console.warn('Não foi possível consultar o gateway ativo, usando padrão Asaas');
      }

      let paymentCustomerId = null;
      let paymentGatewayField = null;
      // 2. Criar cliente no gateway selecionado
      if (activeGateway === 'asaas') {
        try {
          const { data: asaasResult, error: asaasError } = await supabase.functions.invoke('asaas-api', {
            body: {
              action: 'sdkCreateCustomer',
              data: {
                name: data.full_name,
                email: data.email,
                cpfCnpj: data.cpf.replace(/\D/g, ""),
                mobilePhone: data.phone.replace(/\D/g, ""),
                postalCode: "01310930"
              }
            }
          });
          if (asaasError) {
            console.error("Erro ao criar cliente no Asaas:", asaasError);
          } else if (asaasResult?.success && asaasResult?.customer?.id) {
            console.log("Cliente criado no Asaas com sucesso:", asaasResult.customer.id);
            paymentCustomerId = asaasResult.customer.id;
            paymentGatewayField = 'asaas_customer_id';
          }
        } catch (asaasError) {
          console.error("Exceção ao criar cliente no Asaas:", asaasError);
        }
      } else if (activeGateway === 'mercadopago') {
        try {
          // Chamada segura ao endpoint backend
          const response = await fetch('/api/mercadopago-create-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.full_name,
              email: data.email,
              cpf: data.cpf,
              phone: data.phone,
            }),
          });
          const result = await response.json();
          if (!response.ok || !result.customer) {
            throw new Error(result.error?.message || 'Erro ao criar cliente Mercado Pago');
          }
          if (result.success && result.customer?.id) {
            paymentCustomerId = result.customer.id;
            paymentGatewayField = 'mercadopago_customer_id';
            console.log("Cliente criado no MercadoPago com sucesso:", result.customer.id);
            console.error("Erro ao criar cliente no MercadoPago:", result.error);
          }
        } catch (mpError) {
          console.error("Exceção ao criar cliente no MercadoPago:", mpError);
        }
      }

      // 3. Create/update user profile
      const profilePayload: any = {
        id: userId,
        full_name: data.full_name,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ""),
        birth_date: formattedDate,
        phone: data.phone.replace(/\D/g, "")
      };
      if (paymentCustomerId && paymentGatewayField) {
        profilePayload[paymentGatewayField] = paymentCustomerId;
      }
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(profilePayload);

      if (profileError) {
        console.error("Profile Error:", profileError);
        throw profileError;
      }

      // Check if user type already exists before inserting
      const { data: existingType } = await supabase
        .from("user_types")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "individual")
        .maybeSingle();

      if (!existingType) {
        // Add individual user type only if it doesn't exist
        const { error: typeError } = await supabase
          .from("user_types")
          .insert({
            user_id: userId,
            type: "individual",
          });

        if (typeError) {
          console.error("User Type Error:", typeError);
          throw typeError;
        }
      }

      console.log("Registration process completed successfully!");
      return { userId };
    } catch (error) {
      console.error("Error in profile/type creation:", error);
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}