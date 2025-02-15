
import { supabase } from "@/integrations/supabase/client";

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
  phone_number: string;
}

export async function registerUser(data: RegisterData) {
  console.log("Starting user registration process...", { email: data.email });

  // 1. Check if there's already a profile with this CPF
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("cpf", data.cpf.replace(/\D/g, ""))
    .maybeSingle();

  if (existingProfile) {
    throw new Error("CPF já cadastrado");
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    let userId;

    if (existingUser.user) {
      // User exists, use existing ID
      userId = existingUser.user.id;
    } else {
      // Create new auth user
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

      userId = authData.user?.id;
    }

    if (!userId) {
      console.error("No user ID returned from auth signup/signin");
      throw new Error("Erro ao criar/encontrar usuário");
    }

    console.log("Auth user created/found successfully", { userId });

    try {
      // Convert date from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = data.birth_date.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // Create/update user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          full_name: data.full_name,
          email: data.email,
          cpf: data.cpf.replace(/\D/g, ""),
          birth_date: formattedDate,
          phone_number: data.phone_number,
        });

      if (profileError) {
        console.error("Profile Error:", profileError);
        throw profileError;
      }

      // Check if user type already exists before inserting
      const { data: existingType } = await supabase
        .from("user_types")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "individual")
        .maybeSingle();

      if (!existingType) {
        // Add individual user type only if it doesn't exist
        const { error: typeError } = await supabase
          .from("user_types")
          .insert({
            user_id: userId,
            type: "individual",
          });

        if (typeError) {
          console.error("User Type Error:", typeError);
          throw typeError;
        }
      }

      console.log("Registration process completed successfully!");
      return { userId };
    } catch (error) {
      console.error("Error in profile/type creation:", error);
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}
