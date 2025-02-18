
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
import { Gym } from "@/types/gym";

interface GymSettingsFormProps {
  gymId: string;
}

export function GymSettingsForm({ gymId }: GymSettingsFormProps) {
  const { toast } = useToast();
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchGym = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("academias")
          .select("*")
          .eq("id", gymId)
          .single();

        if (error) throw error;

        setGym(data);
        setValue("nome", data.nome);
        setValue("email", data.email);
        setValue("telefone", data.telefone);
        setValue("endereco", data.endereco);
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
    try {
      const { error } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          horario_funcionamento: JSON.parse(JSON.stringify(data.horario_funcionamento)),
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
            <Input id="nome" defaultValue={gym.nome} {...register("nome")} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={gym.email} {...register("email")} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" defaultValue={gym.telefone} {...register("telefone")} />
          </div>
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" defaultValue={gym.endereco} {...register("endereco")} />
          </div>

          <div>
            <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
            <Input
              id="horario_funcionamento"
              defaultValue={JSON.stringify(gym.horario_funcionamento)}
              {...register("horario_funcionamento")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="automatic_checkin">Check-in Automático</Label>
            <Switch
              id="automatic_checkin"
              defaultChecked={gym.automatic_checkin}
              {...register("automatic_checkin")}
            />
          </div>

          <Button type="submit">Salvar Alterações</Button>
        </CardContent>
      </Card>

      {/* Exibição das fotos */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {Array.isArray(gym?.fotos) && gym.fotos.map((foto: string, index: number) => (
          <div key={index} className="relative aspect-square">
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/academy-images/${foto}`}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </form>
  );
}
