
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Loader2, 
  Save, 
  Building2, 
  Clock, 
  Camera, 
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GymPhotosDialog } from "../admin/gyms/GymPhotosDialog";
import type { Gym } from "@/types/gym";
import { BankDetailsForm } from "./forms/BankDetailsForm";
import { BasicInfoTab } from "./settings/BasicInfoTab";
import { ScheduleTab } from "./settings/ScheduleTab";
import { PhotosTab } from "./settings/PhotosTab";
import { DocumentsTab } from "./settings/DocumentsTab";

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

      // Salvar dados bancários
      if (data.titular_nome) {
        const bankData = {
          academia_id: academia.id,
          titular_tipo: data.titular_tipo,
          titular_nome: data.titular_nome,
          titular_cpf_cnpj: data.titular_cpf_cnpj,
          metodo_preferencial: data.metodo_preferencial,
          tipo_chave_pix: data.tipo_chave_pix,
          chave_pix: data.chave_pix,
          banco_codigo: data.banco_codigo,
          banco_nome: data.banco_nome,
          agencia: data.agencia,
          agencia_digito: data.agencia_digito,
          conta: data.conta,
          conta_digito: data.conta_digito,
          tipo_conta: data.tipo_conta,
        };

        const { error: bankError } = await supabase
          .from("academia_dados_bancarios")
          .upsert(bankData)
          .eq("academia_id", academia.id);

        if (bankError) throw bankError;
      }

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
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <BasicInfoTab register={register} errors={errors} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleTab watch={watch} setValue={setValue} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <BankDetailsForm 
              register={register} 
              errors={errors}
              academiaId={academia.id}
            />
          </Card>
          
          <PhotosTab 
            fotos={academia.fotos} 
            onOpenPhotosDialog={() => setIsPhotosDialogOpen(true)} 
          />
          
          <DocumentsTab academiaId={academia.id} />
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
