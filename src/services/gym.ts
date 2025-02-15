
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";

interface GymRegistrationData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  password: string;
  endereco: string;
  horario_funcionamento: Record<string, any>;
  modalidades: string[];
  full_name: string;
  fotos: FileList;
  documentos: FileList;
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
    
    // 1. Criar usuário da academia no auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          user_type: 'gym',
          role: 'gym_owner'
        },
      },
    });

    if (signUpError) {
      console.error("Erro ao criar usuário:", signUpError);
      throw signUpError;
    }

    if (!authData.user?.id) {
      throw new Error("Erro ao criar usuário");
    }

    // 2. Upload das imagens
    const fotosPaths: string[] = [];
    if (data.fotos) {
      for (let i = 0; i < data.fotos.length; i++) {
        const file = data.fotos[i];
        const compressedFile = await compressImage(file);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academy-images')
          .upload(fileName, compressedFile);

        if (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError);
          continue;
        }

        fotosPaths.push(fileName);
      }
    }

    console.log("Upload de imagens concluído:", fotosPaths);

    // 3. Criar academia
    const { data: academiaData, error: academiaError } = await supabase
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
        fotos: fotosPaths,
        status: 'pendente'
      })
      .select()
      .single();

    if (academiaError) {
      console.error("Erro ao criar academia:", academiaError);
      // Limpar imagens enviadas em caso de erro
      for (const path of fotosPaths) {
        await supabase.storage
          .from('academy-images')
          .remove([path]);
      }
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw academiaError;
    }

    console.log("Academia criada com sucesso:", academiaData);

    // 4. Associar modalidades
    if (data.modalidades && data.modalidades.length > 0) {
      const modalidadesAcademia = data.modalidades.map(modalidadeId => ({
        academia_id: academiaData.id,
        modalidade_id: modalidadeId
      }));

      const { error: modalidadesError } = await supabase
        .from('academia_modalidades')
        .insert(modalidadesAcademia);

      if (modalidadesError) {
        console.error("Erro ao associar modalidades:", modalidadesError);
      }
    }

    // 5. Criar role de dono da academia
    const { error: roleError } = await supabase
      .from('user_gym_roles')
      .insert({
        user_id: authData.user.id,
        gym_id: academiaData.id,
        role: 'gym_owner',
        active: true
      });

    if (roleError) {
      console.error("Erro ao criar role:", roleError);
    }

    // 6. Registrar o tipo de usuário
    const { error: userTypeError } = await supabase
      .from('user_types')
      .insert({
        user_id: authData.user.id,
        type: 'gym'
      });

    if (userTypeError) {
      console.error("Erro ao registrar tipo de usuário:", userTypeError);
    }

    return {
      success: true,
      message: 'Academia registrada com sucesso',
      user_id: authData.user.id,
      academia_id: academiaData.id
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
