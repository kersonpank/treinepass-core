import { supabase } from "@/integrations/supabase/client";

interface GymData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  horario_funcionamento: Record<string, { abertura: string; fechamento: string }>;
  modalidades: string[];
  fotos?: FileList;
  documentos?: FileList;
  full_name: string;
  password: string;
}

export async function registerGym(data: GymData, userId: string) {
  console.log("Starting gym registration process...");

  try {
    // 1. Criar a academia
    const { data: academia, error: academiaError } = await supabase
      .from("academias")
      .insert({
        user_id: userId,
        nome: data.nome,
        cnpj: data.cnpj.replace(/\D/g, ""),
        telefone: data.telefone,
        email: data.email,
        endereco: data.endereco,
        horario_funcionamento: data.horario_funcionamento,
        modalidades: data.modalidades,
        status: "pendente",
      })
      .select()
      .single();

    if (academiaError) {
      throw { ...academiaError, userId }; // Incluir userId para limpeza em caso de erro
    }

    // 2. Upload de fotos e documentos
    if (data.fotos) {
      for (let i = 0; i < data.fotos.length; i++) {
        const file = data.fotos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${academia.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academias')
          .upload(fileName, file);

        if (uploadError) {
          throw { ...uploadError, userId, academiaId: academia.id };
        }
      }
    }

    if (data.documentos) {
      for (let i = 0; i < data.documentos.length; i++) {
        const file = data.documentos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${academia.id}/docs/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academias')
          .upload(fileName, file);

        if (uploadError) {
          throw { ...uploadError, userId, academiaId: academia.id };
        }
      }
    }

    return academia;
  } catch (error) {
    // Em caso de erro, propagar o erro com informações para limpeza
    throw { ...error, userId };
  }
}