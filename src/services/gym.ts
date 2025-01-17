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

export async function registerGym(data: GymData, userId?: string) {
  console.log("Starting gym registration process...");

  // 1. Verificar se o CNPJ ou email já existem
  const { data: existingGym } = await supabase
    .from("academias")
    .select("*")
    .or(`email.eq.${data.email},cnpj.eq.${data.cnpj.replace(/\D/g, "")}`)
    .maybeSingle();

  if (existingGym) {
    if (existingGym.email === data.email) {
      throw new Error("Email já cadastrado");
    }
    if (existingGym.cnpj === data.cnpj.replace(/\D/g, "")) {
      throw new Error("CNPJ já cadastrado");
    }
  }

  let gymUserId = userId;

  try {
    // 2. Se não houver userId, criar novo usuário
    if (!gymUserId) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error("Erro ao criar usuário");

      gymUserId = authData.user.id;
    }

    // 3. Criar academia
    const { data: academia, error: academiaError } = await supabase
      .from("academias")
      .insert({
        user_id: gymUserId,
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

    if (academiaError) throw academiaError;

    // 4. Upload de fotos e documentos
    if (data.fotos) {
      for (let i = 0; i < data.fotos.length; i++) {
        const file = data.fotos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${academia.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academias')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
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

        if (uploadError) throw uploadError;
      }
    }

    return academia;
  } catch (error) {
    // Em caso de erro, remover o usuário se ele foi criado neste processo
    if (!userId && gymUserId) {
      await supabase.auth.admin.deleteUser(gymUserId);
    }
    throw error;
  }
}