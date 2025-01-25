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
  try {
    console.log("Starting gym registration process...");
    
    // Ensure modalidades is properly formatted as an array
    const formattedModalidades = Array.isArray(data.modalidades) 
      ? data.modalidades 
      : [data.modalidades];
    
    const { data: result, error } = await supabase
      .rpc("register_academia_with_user", {
        p_nome: data.nome,
        p_cnpj: data.cnpj,
        p_telefone: data.telefone,
        p_email: data.email,
        p_senha: data.senha,
        p_endereco: data.endereco,
        p_horario_funcionamento: data.horario_funcionamento,
        p_modalidades: formattedModalidades,
      });

    if (error) {
      console.error("Erro detalhado:", error);
      throw error;
    }

    if (result) {
      const { success, message, academia_id } = result;
      
      if (!success) {
        throw new Error(message);
      }

      return { academia_id, message };
    }

    throw new Error("Erro inesperado ao criar academia");
  } catch (error: any) {
    console.error("Erro detalhado:", error);
    throw new Error(error.message || "Erro ao registrar academia");
  }
}