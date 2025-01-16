import { supabase } from "@/integrations/supabase/client";

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
}

export async function registerUser(data: RegisterData) {
  // 1. Register user in Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) throw authError;
  if (!authData.user?.id) throw new Error("Erro ao criar usuário");

  // Get the session to ensure we have the correct auth context
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Sessão não encontrada");

  // 2. Create user profile with the same ID as auth user
  const { error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      id: authData.user.id,
      full_name: data.full_name,
      cpf: data.cpf.replace(/\D/g, ""),
      birth_date: data.birth_date,
    });

  if (profileError) throw profileError;

  // 3. Create user type entry
  const { error: typeError } = await supabase
    .from("user_types")
    .insert({
      user_id: authData.user.id,
      type: "individual",
      profile_id: authData.user.id,
    });

  if (typeError) throw typeError;

  return authData.user;
}