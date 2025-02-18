
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Gym } from "@/types/gym";

interface GymSettingsFormProps {
  gymId: string;
}

export function GymSettingsForm({ gymId }: GymSettingsFormProps) {
  const { toast } = useToast();
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchGym = async () => {
      if (!gymId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "ID da academia não fornecido",
        });
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("academias")
          .select(`
            *,
            academia_modalidades (
              modalidades (
                id,
                nome
              )
            )
          `)
          .eq("id", gymId)
          .single();

        if (error) throw error;

        const gymData: Gym = {
          ...data,
          academia_modalidades: data.academia_modalidades?.map((am: any) => ({
            modalidade: am.modalidades
          })) || []
        };

        setGym(gymData);
        setValue("nome", data.nome);
        setValue("email", data.email);
        setValue("telefone", data.telefone);
        setValue("endereco", data.endereco);
        setValue("cnpj", data.cnpj);
        setValue("horario_funcionamento", data.horario_funcionamento);
        setValue("automatic_checkin", data.automatic_checkin);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: error.message || "Ocorreu um erro ao carregar os dados da academia.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGym();
  }, [gymId, setValue, toast]);

  const onSubmitForm = async (data: any) => {
    if (!gymId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da academia não fornecido",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Primeiro, verificar se o CNPJ já existe (excluindo a academia atual)
      if (data.cnpj !== gym?.cnpj) {
        const { data: existingGym, error: checkError } = await supabase
          .from("academias")
          .select("id")
          .eq("cnpj", data.cnpj)
          .neq("id", gymId)
          .single();

        if (existingGym) {
          throw new Error("Este CNPJ já está cadastrado para outra academia");
        }
      }

      // Se passar pela verificação, atualizar os dados
      const { error } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          cnpj: data.cnpj,
          horario_funcionamento: data.horario_funcionamento,
          automatic_checkin: data.automatic_checkin,
        })
        .eq("id", gymId);

      if (error) throw error;

      toast({
        title: "Dados atualizados",
        description: "Os dados da academia foram atualizados com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar dados",
        description: error.message || "Ocorreu um erro ao atualizar os dados da academia.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!gym) {
    return <div>Academia não encontrada.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Academia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome", { required: true })} />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input 
              id="cnpj" 
              {...register("cnpj", { required: true })}
              disabled={isSaving} 
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              {...register("email", { required: true })}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input 
              id="telefone" 
              {...register("telefone")}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input 
              id="endereco" 
              {...register("endereco")}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
            <Input
              id="horario_funcionamento"
              defaultValue={JSON.stringify(gym.horario_funcionamento)}
              {...register("horario_funcionamento")}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="automatic_checkin">Check-in Automático</Label>
            <Switch
              id="automatic_checkin"
              defaultChecked={gym.automatic_checkin}
              {...register("automatic_checkin")}
              disabled={isSaving}
            />
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Exibição das fotos */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {Array.isArray(gym?.fotos) && gym.fotos.map((foto: string, index: number) => (
          <div key={index} className="relative aspect-square">
            <img
              src={`${supabase.storageUrl}/object/public/academy-images/${foto}`}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </form>
  );
}
