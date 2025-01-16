import { supabase } from "@/integrations/supabase/client";

export async function uploadFiles(files: FileList, path: string) {
  const uploadedFiles = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("academias")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    uploadedFiles.push(filePath);
  }
  return uploadedFiles;
}

export async function registerGym(data: any, userId: string) {
  const fotosUrls = await uploadFiles(data.fotos, "fotos");
  const documentosUrls = await uploadFiles(data.documentos, "documentos");

  // Insert academia
  const { data: academia, error: academiaError } = await supabase
    .from("academias")
    .insert({
      nome: data.nome,
      cnpj: data.cnpj,
      telefone: data.telefone,
      email: data.email,
      endereco: data.endereco,
      horario_funcionamento: data.horario_funcionamento,
      modalidades: data.modalidades,
      fotos: fotosUrls,
      documentos: documentosUrls,
      user_id: userId,
    })
    .select()
    .single();

  if (academiaError) throw academiaError;

  // Assign gym owner role
  const { error: roleError } = await supabase.from("user_gym_roles").insert({
    user_id: userId,
    gym_id: academia.id,
    role: "gym_owner",
  });

  if (roleError) throw roleError;

  return academia;
}