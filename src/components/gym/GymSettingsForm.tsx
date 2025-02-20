import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save, Building2, Clock, Camera, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GymPhotosDialog } from "../admin/gyms/GymPhotosDialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Gym } from "@/types/gym";
import { BankDetailsForm } from "./forms/BankDetailsForm";

interface GymSettingsFormProps {
  academia: Gym;
  onSuccess: () => void;
}

export function GymSettingsForm({ academia, onSuccess }: GymSettingsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("info");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nome: academia.nome,
      cnpj: academia.cnpj,
      email: academia.email,
      telefone: academia.telefone || "",
      endereco: academia.endereco || "",
      horario_funcionamento: academia.horario_funcionamento || {
        domingo: { abertura: "09:00", fechamento: "18:00" },
        segunda: { abertura: "06:00", fechamento: "22:00" },
        terca: { abertura: "06:00", fechamento: "22:00" },
        quarta: { abertura: "06:00", fechamento: "22:00" },
        quinta: { abertura: "06:00", fechamento: "22:00" },
        sexta: { abertura: "06:00", fechamento: "22:00" },
        sabado: { abertura: "09:00", fechamento: "18:00" },
      },
      modalidades: academia.modalidades || [],
    },
  });

  const handleHorarioChange = (dia: string, tipo: 'abertura' | 'fechamento', value: string) => {
    setValue(`horario_funcionamento.${dia}.${tipo}`, value);
  };

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
          cnpj: data.cnpj,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          horario_funcionamento: data.horario_funcionamento,
          modalidades: data.modalidades,
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
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
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

  const horario_funcionamento = watch("horario_funcionamento");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dados Bancários
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Fotos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nome da Academia
              </Label>
              <Input
                id="nome"
                {...register("nome", { required: "Nome é obrigatório" })}
              />
              {errors.nome && (
                <p className="text-sm text-red-500">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cnpj" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                CNPJ
              </Label>
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
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="telefone"
                {...register("telefone", { required: "Telefone é obrigatório" })}
              />
              {errors.telefone && (
                <p className="text-sm text-red-500">{errors.telefone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
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
              <Label htmlFor="endereco" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Textarea
                id="endereco"
                {...register("endereco", { required: "Endereço é obrigatório" })}
              />
              {errors.endereco && (
                <p className="text-sm text-red-500">{errors.endereco.message}</p>
              )}
            </div>
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

        <TabsContent value="bank">
          <Card className="p-6">
            <BankDetailsForm register={register} errors={errors} />
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Fotos da Academia</h3>
              <Button
                type="button"
                onClick={() => setIsPhotosDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Gerenciar Fotos
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {academia.fotos?.map((foto: string, index: number) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4 border-t">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      <GymPhotosDialog
        open={isPhotosDialogOpen}
        onOpenChange={setIsPhotosDialogOpen}
        gymId={academia.id}
        onSuccess={onSuccess}
        fotos={academia.fotos}
      />
    </form>
  );
}
