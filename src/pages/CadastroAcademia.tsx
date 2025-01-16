import { useState } from "react";
import { useForm } from "react-hook-form";
import { cnpj } from "cpf-cnpj-validator";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AcademiaFormData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  horario_funcionamento: {
    [key: string]: { abertura: string; fechamento: string };
  };
  modalidades: string[];
  fotos: FileList;
  documentos: FileList;
}

const diasSemana = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

export default function CadastroAcademia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AcademiaFormData>();

  const { data: modalidades } = useQuery({
    queryKey: ["modalidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modalidades").select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleGeolocation = async (endereco: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          endereco
        )}`
      );
      const data = await response.json();
      if (data && data[0]) {
        setCoordinates({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
      }
    } catch (error) {
      console.error("Erro ao obter geolocalização:", error);
    }
  };

  const uploadFiles = async (files: FileList, path: string) => {
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
  };

  const onSubmit = async (data: AcademiaFormData) => {
    try {
      setIsSubmitting(true);

      // Get current user session
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para cadastrar uma academia.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

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
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
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
      const { error: roleError } = await supabase
        .from("user_gym_roles")
        .insert({
          user_id: userId,
          gym_id: academia.id,
          role: "gym_owner",
        });

      if (roleError) throw roleError;

      toast({
        title: "Academia cadastrada com sucesso!",
        description: "Seus dados foram salvos e estão em análise.",
      });

      navigate("/app");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao cadastrar academia",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Cadastro de Academia
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Academia</Label>
                <Input
                  id="nome"
                  {...register("nome", { required: "Nome é obrigatório" })}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  {...register("cnpj", {
                    required: "CNPJ é obrigatório",
                    validate: (value) =>
                      cnpj.isValid(value) || "CNPJ inválido",
                  })}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register("telefone", {
                    required: "Telefone é obrigatório",
                  })}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-500">
                    {errors.telefone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "E-mail é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "E-mail inválido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  {...register("endereco", {
                    required: "Endereço é obrigatório",
                  })}
                  onBlur={(e) => handleGeolocation(e.target.value)}
                />
                {errors.endereco && (
                  <p className="text-sm text-red-500">
                    {errors.endereco.message}
                  </p>
                )}
              </div>
            </div>

            {/* Horários de Funcionamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Horários de Funcionamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diasSemana.map((dia) => (
                  <div key={dia} className="space-y-2">
                    <Label>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        {...register(
                          `horario_funcionamento.${dia}.abertura` as const,
                          { required: true }
                        )}
                      />
                      <Input
                        type="time"
                        {...register(
                          `horario_funcionamento.${dia}.fechamento` as const,
                          { required: true }
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modalidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Modalidades Oferecidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {modalidades?.map((modalidade) => (
                  <div key={modalidade.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={modalidade.id}
                      value={modalidade.id}
                      {...register("modalidades", {
                        required: "Selecione pelo menos uma modalidade",
                      })}
                      className="w-4 h-4 text-[#0125F0] border-gray-300 rounded focus:ring-[#0125F0]"
                    />
                    <Label htmlFor={modalidade.id}>{modalidade.nome}</Label>
                  </div>
                ))}
              </div>
              {errors.modalidades && (
                <p className="text-sm text-red-500">
                  {errors.modalidades.message}
                </p>
              )}
            </div>

            {/* Upload de Arquivos */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fotos">Fotos do Espaço</Label>
                <Input
                  id="fotos"
                  type="file"
                  accept="image/*"
                  multiple
                  {...register("fotos", {
                    required: "Envie pelo menos uma foto",
                  })}
                />
                {errors.fotos && (
                  <p className="text-sm text-red-500">{errors.fotos.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="documentos">Documentos</Label>
                <Input
                  id="documentos"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  {...register("documentos", {
                    required: "Envie os documentos necessários",
                  })}
                />
                {errors.documentos && (
                  <p className="text-sm text-red-500">
                    {errors.documentos.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0125F0] hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar Academia"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}