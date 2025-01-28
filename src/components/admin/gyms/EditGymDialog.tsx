import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditGymDialogProps {
  gym: {
    id: string;
    nome: string;
    cnpj: string;
    email: string;
    telefone: string | null;
    endereco: string | null;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface GymFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  status: string;
}

export function EditGymDialog({ gym, open, onOpenChange, onSuccess }: EditGymDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GymFormData>({
    defaultValues: {
      nome: gym.nome,
      cnpj: gym.cnpj,
      email: gym.email,
      telefone: gym.telefone || "",
      endereco: gym.endereco || "",
      status: gym.status,
    },
  });

  const currentStatus = watch("status");

  const onSubmit = async (data: GymFormData) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
          cnpj: data.cnpj,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          status: data.status,
        })
        .eq("id", gym.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Academia atualizada com sucesso",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Academia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
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
              {...register("cnpj", { required: "CNPJ é obrigatório" })}
            />
            {errors.cnpj && (
              <p className="text-sm text-red-500">{errors.cnpj.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Email é obrigatório" })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" {...register("telefone")} />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register("endereco")} />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(value) => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
