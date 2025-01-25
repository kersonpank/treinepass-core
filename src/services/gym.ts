import { supabase } from "@/integrations/supabase/client";

interface GymRegistrationData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  senha: string;
  endereco: string;
  horario_funcionamento: Record<string, any>;
  modalidades: string[];
}

export async function registerGym(data: GymRegistrationData) {
  console.log("Iniciando registro de academia com dados:", { ...data, senha: '[REDACTED]' });

  try {
    const { data: result, error } = await supabase
      .rpc('register_academia_with_user', {
        p_nome: data.nome,
        p_cnpj: data.cnpj,
        p_telefone: data.telefone,
        p_email: data.email,
        p_senha: data.senha,
        p_endereco: data.endereco,
        p_horario_funcionamento: data.horario_funcionamento,
        p_modalidades: data.modalidades
      });

    if (error) {
      console.error("Erro ao registrar academia:", error);
      throw error;
    }

    if (!result.success) {
      throw new Error(result.message);
    }

    console.log("Academia registrada com sucesso:", result);
    return {
      success: result.success,
      message: result.message,
      academia_id: result.academia_id,
      user_id: result.user_id
    };
  } catch (error: any) {
    console.error("Erro detalhado:", error);
    throw error;
  }
}