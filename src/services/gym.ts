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

interface RegistrationResult {
  success: boolean;
  message: string;
  user_id?: string;
  academia_id?: string;
}

export async function registerGym(data: GymRegistrationData): Promise<RegistrationResult> {
  try {
    console.log("Iniciando registro de academia com dados:", { ...data, password: '[REDACTED]' });
    
    const { data: result, error } = await supabase.rpc('register_academia_with_user', {
      p_nome: data.nome,
      p_cnpj: data.cnpj,
      p_telefone: data.telefone,
      p_email: data.email,
      p_senha: data.password,
      p_endereco: data.endereco,
      p_horario_funcionamento: data.horario_funcionamento,
      p_modalidades: data.modalidades
    });

    if (error) {
      console.error("Erro ao registrar academia:", error);
      return {
        success: false,
        message: error.message || 'Erro ao registrar academia'
      };
    }

    console.log("Resultado do registro:", result);

    // Parse the result properly
    if (result && typeof result === 'object') {
      const { success, message, user_id, academia_id } = result;
      return {
        success: Boolean(success),
        message: message || 'Academia registrada com sucesso',
        user_id: user_id || undefined,
        academia_id: academia_id || undefined
      };
    }

    return {
      success: false,
      message: 'Resposta inválida do servidor'
    };

  } catch (error: any) {
    console.error('Erro detalhado ao registrar academia:', error);
    return {
      success: false,
      message: error.message || 'Erro ao registrar academia'
    };
  }
}

export async function getGymModalities() {
  const { data, error } = await supabase
    .from('modalidades')
    .select('*')
    .eq('active', true)
    .order('nome');

  if (error) throw error;
  return data;
}

export const getGymById = async (id: string) => {
  const { data, error } = await supabase
    .from("academias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching gym:", error);
    throw error;
  }

  return data;
};

export const getGymsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("academias")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching gyms:", error);
    throw error;
  }

  return data;
};

export const createGym = async (gymData: any) => {
  const { data, error } = await supabase
    .from("academias")
    .insert(gymData)
    .select()
    .single();

  if (error) {
    console.error("Error creating gym:", error);
    throw error;
  }

  return data;
};

export const updateGym = async (id: string, gymData: any) => {
  const { data, error } = await supabase
    .from("academias")
    .update(gymData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating gym:", error);
    throw error;
  }

  return data;
};

export const deleteGym = async (id: string) => {
  const { error } = await supabase
    .from("academias")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting gym:", error);
    throw error;
  }
};

type GymRole = "gym_owner" | "gym_admin" | "gym_staff";

export const createGymRole = async (userId: string, gymId: string, role: GymRole) => {
  const { data, error } = await supabase
    .from("user_gym_roles")
    .insert({
      user_id: userId,
      gym_id: gymId,
      role: role
    });

  if (error) {
    console.error("Error creating gym role:", error);
    throw error;
  }

  return data;
};

export const getGymRole = async (userId: string, gymId: string) => {
  const { data, error } = await supabase
    .from("user_gym_roles")
    .select("*")
    .eq("user_id", userId)
    .eq("gym_id", gymId)
    .single();

  if (error) {
    console.error("Error fetching gym role:", error);
    throw error;
  }

  return data;
};

export const updateGymRole = async (userId: string, gymId: string, role: GymRole) => {
  const { data, error } = await supabase
    .from("user_gym_roles")
    .update({ role })
    .eq("user_id", userId)
    .eq("gym_id", gymId)
    .select()
    .single();

  if (error) {
    console.error("Error updating gym role:", error);
    throw error;
  }

  return data;
};

export const deleteGymRole = async (userId: string, gymId: string) => {
  const { error } = await supabase
    .from("user_gym_roles")
    .delete()
    .eq("user_id", userId)
    .eq("gym_id", gymId);

  if (error) {
    console.error("Error deleting gym role:", error);
    throw error;
  }
};