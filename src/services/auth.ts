import { supabase } from "@/integrations/supabase/client";

interface RegisterData {
  email: string;
  password: string;
  cpf: string;
}

export async function checkExistingUser(email: string, cpf: string) {
  console.log("Checking if user exists...", { email, cpf });

  // Check if email exists in auth.users
  const { data: emailExists, error: emailError } = await supabase
    .from("user_profiles")
    .select("email")
    .eq("email", email)
    .single();

  if (emailError && emailError.code !== "PGRST116") {
    console.error("Error checking email:", emailError);
    throw emailError;
  }

  if (emailExists) {
    throw new Error("Email já cadastrado");
  }

  // Check if CPF exists
  const { data: cpfExists, error: cpfError } = await supabase
    .from("user_profiles")
    .select("cpf")
    .eq("cpf", cpf.replace(/\D/g, ""))
    .single();

  if (cpfError && cpfError.code !== "PGRST116") {
    console.error("Error checking CPF:", cpfError);
    throw cpfError;
  }

  if (cpfExists) {
    throw new Error("CPF já cadastrado");
  }
}

export async function registerUser(data: RegisterData) {
  console.log("Starting user registration process...", { email: data.email });

  try {
    // First check if user exists - this will throw an error if email or CPF exists
    await checkExistingUser(data.email, data.cpf);

    // If we get here, user doesn't exist, proceed with registration
    console.log("User doesn't exist, creating auth user...");
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

    // Create user profile
    console.log("Creating user profile...");
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ""),
      });

    if (profileError) {
      console.error("Profile Error:", profileError);
      // If profile creation fails, we should delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    console.log("User profile created successfully");

    // Create user type entry
    console.log("Creating user type entry...");
    const { error: typeError } = await supabase
      .from("user_types")
      .insert({
        user_id: authData.user.id,
        type: "individual",
        profile_id: authData.user.id,
      });

    if (typeError) {
      console.error("User Type Error:", typeError);
      // If user type creation fails, we should delete everything
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw typeError;
    }

    console.log("User type entry created successfully");
    console.log("Registration process completed successfully!");

    return authData.user;
  } catch (error) {
    // If any error occurs, ensure we clean up any partial data
    console.error("Registration failed:", error);
    throw error;
  }
}