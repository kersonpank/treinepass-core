import { supabase } from "@/integrations/supabase/client";

interface GymRegistrationData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  horario_funcionamento: Record<string, any>;
  modalidades: string[];
}

export async function registerGym(data: GymRegistrationData) {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error("Usuário não autenticado");
    }

    const userId = session.session.user.id;

    const { data: result, error } = await supabase
      .rpc("create_academia_v2", {
        p_user_id: userId,
        p_nome: data.nome,
        p_cnpj: data.cnpj,
        p_telefone: data.telefone,
        p_email: data.email,
        p_endereco: data.endereco,
        p_horario_funcionamento: data.horario_funcionamento,
        p_modalidades: data.modalidades,
      });

    if (error) throw error;

    if (Array.isArray(result) && result[0]) {
      const { academia_id, success, message } = result[0];
      
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