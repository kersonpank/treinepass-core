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
    
    // 2. Iniciar transação
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
      // 3. Criar a academia usando transação
      const { data: academia, error: academiaError } = await supabase.rpc('create_academia', {
        user_id: authData.user.id,
        nome: data.nome,
        cnpj_input: data.cnpj.replace(/\D/g, ""),
        telefone: data.telefone,
        email_input: data.email,
        endereco: data.endereco,
        horario_funcionamento: data.horario_funcionamento,
        modalidades: data.modalidades,
        status: "pendente"
      });

      if (academiaError) {
        // Se houver erro na criação da academia, deletar o usuário criado
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error("Erro ao criar academia:", academiaError);
        throw new Error("Erro ao criar academia: " + academiaError.message);
      }

      if (!academia) {
        // Se não houver academia criada, deletar o usuário
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error("Erro ao criar registro da academia");
      }

      // 4. Upload de arquivos
      if (data.fotos || data.documentos) {
        try {
          await uploadFiles(data, academia.id);
        } catch (uploadError) {
          // Se houver erro no upload, deletar academia e usuário
          await supabase.from("academias").delete().eq("id", academia.id);
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw uploadError;
        }
      }

      return academia;
    } catch (error) {
      // Em caso de qualquer erro, garantir que o usuário seja deletado
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
  } catch (error) {
    console.error("Erro durante o registro:", error);
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