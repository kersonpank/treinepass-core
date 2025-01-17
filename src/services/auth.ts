import { supabase } from "@/integrations/supabase/client";

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
}

export async function registerUser(data: RegisterData) {
  console.log("Starting user registration process...", { email: data.email });

  // 1. Verificar se o email ou CPF já existem
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .or(`email.eq.${data.email},cpf.eq.${data.cpf.replace(/\D/g, "")}`)
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.email === data.email) {
      throw new Error("Email já cadastrado");
    }
    if (existingProfile.cpf === data.cpf.replace(/\D/g, "")) {
      throw new Error("CPF já cadastrado");
    }
  }

  // 2. Register user in Auth
  console.log("Step 1: Creating auth user...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
    },
  });

  if (authError) {
    console.error("Auth Error:", authError);
    throw authError;
  }

  if (!authData.user?.id) {
    console.error("No user ID returned from auth signup");
    throw new Error("Erro ao criar usuário");
  }

  console.log("Auth user created successfully", { userId: authData.user.id });

  try {
    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = data.birth_date.split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // 3. Create user profile
    console.log("Step 2: Creating user profile...");
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        full_name: data.full_name,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ""),
        birth_date: formattedDate,
      });

    if (profileError) {
      // Se houver erro ao criar o perfil, remover o usuário auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error("Profile Error:", profileError);
      throw profileError;
    }

    // 4. Create user type entry
    console.log("Step 3: Creating user type entry...");
    const { error: typeError } = await supabase
      .from("user_types")
      .insert({
        user_id: authData.user.id,
        type: "individual",
        profile_id: authData.user.id,
      });

    if (typeError) {
      // Se houver erro ao criar o tipo, remover o usuário e o perfil
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error("User Type Error:", typeError);
      throw typeError;
    }

    console.log("Registration process completed successfully!");
    return authData.user;
  } catch (error) {
    // Em caso de erro em qualquer etapa após a criação do usuário auth,
    // remover o usuário para evitar dados parciais
    if (authData.user?.id) {
      await supabase.auth.admin.deleteUser(authData.user.id);
    }
    throw error;
  }
}