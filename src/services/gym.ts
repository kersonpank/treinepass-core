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

async function checkExistingUser(email: string) {
  console.log("Verificando usuário existente:", email);
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error("Erro ao verificar usuário existente:", error);
    return null;
  }

  console.log("Resultado da verificação de usuário:", data);
  return data;
}

async function createNewUser(email: string, password: string, full_name: string) {
  console.log("Iniciando criação de novo usuário:", { email, full_name });
  
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });

  if (signUpError) {
    console.error("Erro ao criar usuário:", signUpError);
    throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
  }

  if (!authData.user?.id) {
    console.error("ID do usuário não retornado após criação");
    throw new Error("Erro ao processar cadastro do usuário");
  }

  console.log("Usuário criado com sucesso:", authData.user.id);
  return authData.user;
}

export async function registerGym(data: GymData) {
  console.log("Iniciando processo de registro da academia...");

  try {
    // 1. Verificar se já existe um usuário com este email
    const existingUser = await checkExistingUser(data.email);
    let userId;

    if (existingUser) {
      console.log("Usuário já existe, usando ID existente:", existingUser.id);
      userId = existingUser.id;
      throw new Error("Email já cadastrado. Por favor, faça login ou use outro email.");
    } else {
      // 2. Se não existir, criar novo usuário
      const newUser = await createNewUser(data.email, data.password, data.full_name);
      userId = newUser.id;
    }

    // 3. Criar a academia usando a função do banco de dados
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
      if (academiaError.message.includes("Email já cadastrado")) {
        throw new Error("Este email já está cadastrado para outra academia");
      } else if (academiaError.message.includes("CNPJ já cadastrado")) {
        throw new Error("Este CNPJ já está cadastrado no sistema");
      }
      throw academiaError;
    }

    if (!academia || academia.length === 0) {
      throw new Error("Erro ao criar registro da academia");
    }

    console.log("Academia registrada com sucesso:", academia[0]);

    // 4. Upload de arquivos
    if (data.fotos || data.documentos) {
      await uploadFiles(data, academia[0].academia_id);
    }

    return academia[0];
  } catch (error: any) {
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