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

  // 1. Register user in Auth
  console.log("Step 1: Creating auth user...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
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

  // Get the session to ensure we have the correct auth context
  console.log("Step 2: Getting session...");
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Session Error:", sessionError);
    throw sessionError;
  }

  if (!sessionData.session) {
    console.error("No session found after signup");
    throw new Error("Sessão não encontrada");
  }

  console.log("Session obtained successfully");

  // 2. Create user profile with the same ID as auth user
  console.log("Step 3: Creating user profile...", {
    userId: authData.user.id,
    fullName: data.full_name,
  });

  const { error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      id: authData.user.id,
      full_name: data.full_name,
      cpf: data.cpf.replace(/\D/g, ""),
      birth_date: data.birth_date,
    });

  if (profileError) {
    console.error("Profile Error:", profileError);
    throw profileError;
  }

  console.log("User profile created successfully");

  // 3. Create user type entry
  console.log("Step 4: Creating user type entry...");
  const { error: typeError } = await supabase
    .from("user_types")
    .insert({
      user_id: authData.user.id,
      type: "individual",
      profile_id: authData.user.id,
    });

  if (typeError) {
    console.error("User Type Error:", typeError);
    throw typeError;
  }

  console.log("User type entry created successfully");
  console.log("Registration process completed successfully!");

  return authData.user;
}