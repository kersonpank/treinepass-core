import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { GymRepassRules } from "./GymRepassRules";

interface EditGymDialogProps {
  gym: {
    id: string;
    nome: string;
    cnpj: string;
    email: string;
    telefone: string | null;
    endereco: string | null;
    status: string;
    horario_funcionamento?: Record<string, any>;
    academia_modalidades?: { modalidade: { nome: string; id: string } }[];
    usa_regras_personalizadas?: boolean;
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
  horario_funcionamento: Record<string, any>;
  usa_regras_personalizadas: boolean;
}

export function EditGymDialog({ gym, open, onOpenChange, onSuccess }: EditGymDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModalidades, setSelectedModalidades] = useState<string[]>(
    gym.academia_modalidades?.map(am => am.modalidade.id) || []
  );
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
      horario_funcionamento: gym.horario_funcionamento || {
        domingo: { abertura: "09:00", fechamento: "18:00" },
        segunda: { abertura: "06:00", fechamento: "22:00" },
        terca: { abertura: "06:00", fechamento: "22:00" },
        quarta: { abertura: "06:00", fechamento: "22:00" },
        quinta: { abertura: "06:00", fechamento: "22:00" },
        sexta: { abertura: "06:00", fechamento: "22:00" },
        sabado: { abertura: "09:00", fechamento: "18:00" },
      },
      usa_regras_personalizadas: gym.usa_regras_personalizadas || false,
    },
  });

  const { data: modalidades = [] } = useQuery({
    queryKey: ["modalidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalidades")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const currentStatus = watch("status");
  const horario_funcionamento = watch("horario_funcionamento");
  const usa_regras_personalizadas = watch("usa_regras_personalizadas");

  const onSubmit = async (data: GymFormData) => {
    try {
      setIsSubmitting(true);

      // Atualizar informações básicas da academia
      const { error: updateError } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
          cnpj: data.cnpj,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          status: data.status,
          horario_funcionamento: data.horario_funcionamento,
          usa_regras_personalizadas: data.usa_regras_personalizadas,
        })
        .eq("id", gym.id);

      if (updateError) throw updateError;

      const existingModalidades = gym.academia_modalidades?.map(am => am.modalidade.id) || [];
      const modalidadesToAdd = selectedModalidades.filter(id => !existingModalidades.includes(id));
      const modalidadesToRemove = existingModalidades.filter(id => !selectedModalidades.includes(id));

      if (modalidadesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("academia_modalidades")
          .upsert(
            modalidadesToAdd.map(modalidadeId => ({
              academia_id: gym.id,
              modalidade_id: modalidadeId
            })),
            { onConflict: 'academia_id,modalidade_id' }
          );

        if (insertError) throw insertError;
      }

      if (modalidadesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("academia_modalidades")
          .delete()
          .eq("academia_id", gym.id)
          .in("modalidade_id", modalidadesToRemove);

        if (deleteError) throw deleteError;
      }

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

  const handleHorarioChange = (dia: string, tipo: 'abertura' | 'fechamento', value: string) => {
    setValue(`horario_funcionamento.${dia}.${tipo}`, value);
  };

  const diasSemana = [
    { key: 'domingo', label: 'Domingo' },
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Editar Academia</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="schedule">Horários</TabsTrigger>
            <TabsTrigger value="modalities">Modalidades</TabsTrigger>
            <TabsTrigger value="rules">Regras de Repasse</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <TabsContent value="info">
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
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              {diasSemana.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-3 gap-4 items-center">
                  <Label>{label}</Label>
                  <div>
                    <Label htmlFor={`${key}-abertura`}>Abertura</Label>
                    <Input
                      id={`${key}-abertura`}
                      type="time"
                      value={horario_funcionamento[key]?.abertura || ""}
                      onChange={(e) => handleHorarioChange(key, 'abertura', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-fechamento`}>Fechamento</Label>
                    <Input
                      id={`${key}-fechamento`}
                      type="time"
                      value={horario_funcionamento[key]?.fechamento || ""}
                      onChange={(e) => handleHorarioChange(key, 'fechamento', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="modalities" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {modalidades.map((modalidade) => (
                  <div key={modalidade.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={modalidade.id}
                      checked={selectedModalidades.includes(modalidade.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModalidades([...selectedModalidades, modalidade.id]);
                        } else {
                          setSelectedModalidades(selectedModalidades.filter(id => id !== modalidade.id));
                        }
                      }}
                    />
                    <Label htmlFor={modalidade.id}>{modalidade.nome}</Label>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rules">
              <GymRepassRules
                gymId={gym.id}
                usaRegrasPersonalizadas={usa_regras_personalizadas}
                onToggleCustomRules={(value) => setValue("usa_regras_personalizadas", value)}
              />
            </TabsContent>

            <div className="flex justify-end space-x-2 pt-4">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
