import { supabase } from "@/integrations/supabase/client";

interface GymRegistrationData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  password: string;
  endereco: string;
  horario_funcionamento: Record<string, any>;
  modalidades: string[];
}

export async function registerGym(data: GymRegistrationData) {
  try {
    console.log("Starting gym registration process...");
    
    // Ensure modalidades is properly formatted as an array
    const formattedModalidades = Array.isArray(data.modalidades) 
      ? data.modalidades 
      : [data.modalidades];

    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      console.error("Auth Error:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Erro ao criar usuário");
    }

    console.log("Auth user created:", authData.user.id);
    
    const { data: result, error } = await supabase
      .rpc("create_academia_v2", {
        p_user_id: authData.user.id,
        p_nome: data.nome,
        p_cnpj: data.cnpj,
        p_telefone: data.telefone,
        p_email: data.email,
        p_endereco: data.endereco,
        p_horario_funcionamento: data.horario_funcionamento,
        p_modalidades: formattedModalidades,
      });

    if (error) {
      console.error("Erro detalhado:", error);
      throw error;
    }

    if (Array.isArray(result) && result[0]) {
      const { academia_id, success, message } = result[0];
      
      if (!success) {
        throw new Error(message);
      }

      // Insert user type
      const { error: typeError } = await supabase
        .from('user_types')
        .insert({
          user_id: authData.user.id,
          type: 'gym'
        });

      if (typeError) {
        console.error("Error adding user type:", typeError);
      }

      // Insert gym role
      const { error: roleError } = await supabase
        .from('user_gym_roles')
        .insert({
          user_id: authData.user.id,
          gym_id: academia_id,
          role: 'owner',
          active: true
        });

      if (roleError) {
        console.error("Error adding gym role:", roleError);
      }

      return { academia_id, message };
    }

    throw new Error("Erro inesperado ao criar academia");
  } catch (error: any) {
    console.error("Erro detalhado:", error);
    throw new Error(error.message || "Erro ao registrar academia");
  }
}