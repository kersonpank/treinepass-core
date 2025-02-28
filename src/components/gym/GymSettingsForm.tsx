
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save, Building2, Clock, Camera, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GymPhotosDialog } from "../admin/gyms/GymPhotosDialog";
import type { Gym } from "@/types/gym";
import { BankDetailsForm } from "./forms/BankDetailsForm";
import { BasicInfoTab } from "./settings/BasicInfoTab";
import { ScheduleTab } from "./settings/ScheduleTab";
import { PhotosTab } from "./settings/PhotosTab";

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
          <BasicInfoTab register={register} errors={errors} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleTab watch={watch} setValue={setValue} />
        </TabsContent>

        <TabsContent value="bank">
          <Card className="p-6">
            <BankDetailsForm register={register} errors={errors} />
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <PhotosTab 
            fotos={academia.fotos} 
            onOpenPhotosDialog={() => setIsPhotosDialogOpen(true)} 
          />
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
