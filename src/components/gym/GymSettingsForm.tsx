import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cnpj } from "cpf-cnpj-validator";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Academia = Tables<"academias">;

interface GymSettingsFormProps {
  academia: Academia;
  onSuccess: () => void;
}

type GymFormData = {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  horario_funcionamento: string;
  modalidades: string[];
};

export function GymSettingsForm({ academia, onSuccess }: GymSettingsFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GymFormData>({
    defaultValues: {
      nome: academia.nome,
      cnpj: academia.cnpj,
      telefone: academia.telefone,
      email: academia.email,
      endereco: academia.endereco,
      horario_funcionamento: JSON.stringify(academia.horario_funcionamento),
      modalidades: academia.modalidades || [],
    },
  });

  const { data: modalidades } = useQuery({
    queryKey: ["modalidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalidades")
        .select("*")
        .eq("active", true)
        .order("nome");
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: GymFormData) => {
    try {
      const { error } = await supabase
        .from("academias")
        .update({
          ...data,
          horario_funcionamento: JSON.parse(data.horario_funcionamento),
        })
        .eq("id", academia.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar informações",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            validate: (value) => cnpj.isValid(value) || "CNPJ inválido",
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
          {...register("telefone", { required: "Telefone é obrigatório" })}
        />
        {errors.telefone && (
          <p className="text-sm text-red-500">{errors.telefone.message}</p>
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
          {...register("endereco", { required: "Endereço é obrigatório" })}
        />
        {errors.endereco && (
          <p className="text-sm text-red-500">{errors.endereco.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Modalidades</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modalidades?.map((modalidade) => (
            <div key={modalidade.id} className="flex items-center space-x-2">
              <Checkbox
                id={modalidade.id}
                {...register("modalidades")}
                value={modalidade.id}
                defaultChecked={academia.modalidades?.includes(modalidade.id)}
              />
              <Label htmlFor={modalidade.id} className="text-sm">
                {modalidade.nome}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#0125F0] hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}