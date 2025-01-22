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

async function checkExistingUser(email: string) {
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile.id;
  }

  return null;
}

export async function registerGym(data: GymData) {
  console.log("Iniciando processo de registro da academia...");

  try {
    // 1. Primeiro, verificar duplicatas
    await checkDuplicates(data.email, data.cnpj);
    
    // 2. Verificar se o usuário já existe
    const existingUserId = await checkExistingUser(data.email);
    let userId = existingUserId;

    if (!userId) {
      // 3. Se não existir, criar novo usuário
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

      userId = authData.user.id;
    }

    console.log("ID do usuário:", userId);

    try {
      // 4. Criar a academia usando a função do banco de dados
      const { data: academia, error: academiaError } = await supabase.rpc('create_academia', {
        p_user_id: userId,
        p_nome: data.nome,
        p_cnpj: data.cnpj.replace(/\D/g, ""),
        p_telefone: data.telefone,
        p_email: data.email,
        p_endereco: data.endereco,
        p_horario_funcionamento: data.horario_funcionamento,
        p_modalidades: data.modalidades,
        p_status: "pendente"
      });

      if (academiaError) {
        console.error("Erro ao criar academia:", academiaError);
        throw academiaError;
      }

      if (!academia || academia.length === 0) {
        throw new Error("Erro ao criar registro da academia");
      }

      // 5. Upload de arquivos
      if (data.fotos || data.documentos) {
        await uploadFiles(data, academia[0].academia_id);
      }

      return academia[0];
    } catch (error) {
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