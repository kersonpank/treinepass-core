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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, Mail, MapPin, Phone, Camera, Save, Loader2 } from "lucide-react";
import { GymPhotosDialog } from "../admin/gyms/GymPhotosDialog";
import { useState } from "react";

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
  horario_funcionamento: Record<string, { abertura: string; fechamento: string }>;
  modalidades: string[];
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

export function GymSettingsForm({ academia, onSuccess }: GymSettingsFormProps) {
  const { toast } = useToast();
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<GymFormData>({
    defaultValues: {
      nome: academia.nome,
      cnpj: academia.cnpj,
      telefone: academia.telefone || "",
      email: academia.email,
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

  const horario_funcionamento = watch("horario_funcionamento");

  const handleHorarioChange = (dia: string, tipo: 'abertura' | 'fechamento', value: string) => {
    setValue(`horario_funcionamento.${dia}.${tipo}`, value);
  };

  const onSubmit = async (data: GymFormData) => {
    try {
      const { error } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
          cnpj: data.cnpj,
          telefone: data.telefone,
          email: data.email,
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
        description: error.message || "Erro ao atualizar informações",
      });
    }
  };

  const getImageUrl = (path: string) => {
    if (path?.startsWith('http')) return path;
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${path}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="modalities" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Modalidades
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
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {label}
              </Label>
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
              {academia.fotos?.map((foto, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={getImageUrl(foto)}
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
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
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
      />
    </form>
  );
}