import { supabase } from "@/integrations/supabase/client";

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

export const createGymRole = async (userId: string, gymId: string) => {
  const { data, error } = await supabase
    .from("user_gym_roles")
    .insert({
      user_id: userId,
      gym_id: gymId,
      role: "gym_owner"
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

export const updateGymRole = async (userId: string, gymId: string, role: string) => {
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