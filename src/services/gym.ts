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

async function checkDuplicates(email: string, cnpj: string) {
  console.log("Verificando duplicatas...");
  
  // Verificar email
  const { count: emailCount, error: emailError } = await supabase
    .from("academias")
    .select("*", { count: 'exact', head: true })
    .eq("email", email);

  if (emailError) {
    console.error("Erro ao verificar email:", emailError);
    throw new Error("Erro ao verificar email no sistema");
  }

  if (emailCount && emailCount > 0) {
    console.log("Email duplicado encontrado:", email);
    throw new Error("Este email já está cadastrado no sistema");
  }

  // Verificar CNPJ
  const { count: cnpjCount, error: cnpjError } = await supabase
    .from("academias")
    .select("*", { count: 'exact', head: true })
    .eq("cnpj", cnpj.replace(/\D/g, ""));

  if (cnpjError) {
    console.error("Erro ao verificar CNPJ:", cnpjError);
    throw new Error("Erro ao verificar CNPJ no sistema");
  }

  if (cnpjCount && cnpjCount > 0) {
    console.log("CNPJ duplicado encontrado:", cnpj);
    throw new Error("Este CNPJ já está cadastrado no sistema");
  }

  console.log("Nenhuma duplicata encontrada");
  return true;
}

export async function registerGym(data: GymData) {
  console.log("Iniciando processo de registro da academia...");

  try {
    // 1. Primeiro, verificar duplicatas
    await checkDuplicates(data.email, data.cnpj);
    
    // 2. Se passou pela verificação, criar o usuário
    console.log("Criando usuário na autenticação...");
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (signUpError) {
      console.error("Erro ao criar usuário:", signUpError);
      throw new Error("Erro ao criar usuário: " + signUpError.message);
    }

    if (!authData.user?.id) {
      console.error("ID do usuário não retornado após criação");
      throw new Error("Erro ao processar cadastro do usuário");
    }

    console.log("Usuário criado com sucesso. ID:", authData.user.id);

    try {
      // 3. Criar a academia
      console.log("Criando registro da academia...");
      const { data: academia, error: academiaError } = await supabase
        .from("academias")
        .insert({
          user_id: authData.user.id,
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
        console.error("Erro ao criar academia:", academiaError);
        // Se houver erro ao criar academia, remover o usuário criado
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error("Erro ao criar academia: " + academiaError.message);
      }

      // 4. Upload de arquivos
      if (data.fotos || data.documentos) {
        console.log("Iniciando upload de arquivos...");
        await uploadFiles(data, academia.id);
      }

      console.log("Registro da academia concluído com sucesso!");
      return academia;
    } catch (error: any) {
      // Em caso de erro após criar o usuário, tentar limpar
      console.error("Erro durante o processo de registro:", error);
      if (authData.user?.id) {
        console.log("Removendo usuário devido a erro:", authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Erro fatal durante o registro:", error);
    throw error;
  }
}

async function uploadFiles(data: GymData, academiaId: string) {
  try {
    if (data.fotos) {
      for (let i = 0; i < data.fotos.length; i++) {
        const file = data.fotos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${academiaId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academias')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Erro no upload de foto:", uploadError);
          throw new Error("Erro ao fazer upload de foto: " + uploadError.message);
        }
      }
    }

    if (data.documentos) {
      for (let i = 0; i < data.documentos.length; i++) {
        const file = data.documentos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${academiaId}/docs/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academias')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Erro no upload de documento:", uploadError);
          throw new Error("Erro ao fazer upload de documento: " + uploadError.message);
        }
      }
    }
  } catch (error: any) {
    console.error("Erro durante upload de arquivos:", error);
    throw error;
  }
}