<<<<<<< HEAD
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
import { GymPhotosDialog } from "@/components/admin/gyms/GymPhotosDialog";
import { OperatingHoursForm } from "@/components/gym/forms/OperatingHoursForm";
import { ModalitiesForm } from "@/components/gym/forms/ModalitiesForm";
import { BankDataForm } from "@/components/gym/forms/BankDataForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GymSettingsFormProps {
  gymId: string;
}

export function GymSettingsForm({ gymId }: GymSettingsFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [replicateHours, setReplicateHours] = useState(false);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [bankData, setBankData] = useState<any>(null);
=======

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
>>>>>>> main

  const {
    register,
    handleSubmit,
<<<<<<< HEAD
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchModalidades = async () => {
      const { data, error } = await supabase
        .from('modalidades')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (!error && data) {
        setModalidades(data);
      }
    };

    fetchModalidades();
  }, []);

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
      const { data: gymData, error } = await supabase
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

      const horarioFuncionamento = typeof gymData.horario_funcionamento === 'object' 
        ? gymData.horario_funcionamento 
        : {
            segunda: { abertura: "08:00", fechamento: "18:00" },
            terca: { abertura: "08:00", fechamento: "18:00" },
            quarta: { abertura: "08:00", fechamento: "18:00" },
            quinta: { abertura: "08:00", fechamento: "18:00" },
            sexta: { abertura: "08:00", fechamento: "18:00" },
            sabado: { abertura: "08:00", fechamento: "18:00" },
            domingo: { abertura: "08:00", fechamento: "18:00" }
          };

      const gymWithCorrectTypes: Gym = {
        ...gymData,
        horario_funcionamento: horarioFuncionamento,
        academia_modalidades: (gymData.academia_modalidades || []).map((am: any) => ({
          modalidade: am.modalidades
        })),
        fotos: Array.isArray(gymData.fotos) ? gymData.fotos : [],
        documentos: Array.isArray(gymData.documentos) ? gymData.documentos : []
      };

      setGym(gymWithCorrectTypes);
      
      setValue("nome", gymData.nome);
      setValue("email", gymData.email);
      setValue("telefone", gymData.telefone);
      setValue("endereco", gymData.endereco);
      setValue("cnpj", gymData.cnpj);
      setValue("horario_funcionamento", horarioFuncionamento);
      setValue("automatic_checkin", gymData.automatic_checkin);
      setValue("modalidades", gymData.academia_modalidades?.map((am: any) => am.modalidades.id) || []);
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

  useEffect(() => {
    fetchGym();
  }, [gymId, setValue, toast]);

  const fetchBankData = async () => {
    if (!gymId) return;

    try {
      console.log('Buscando dados bancários para academia:', gymId);
      const { data, error } = await supabase
        .from('academia_dados_bancarios')
        .select('*')
        .eq('academia_id', gymId)
        .maybeSingle();

      if (error) throw error;

      console.log('Dados bancários recebidos:', data);
      setBankData(data || null);
    } catch (error: any) {
      console.error('Erro ao carregar dados bancários:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados bancários",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (gymId) {
      fetchBankData();
    }
  }, [gymId]);

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

      const { error: updateError } = await supabase
        .from("academias")
        .update({
          nome: data.nome,
=======
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
>>>>>>> main
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          cnpj: data.cnpj,
          horario_funcionamento: data.horario_funcionamento,
          automatic_checkin: data.automatic_checkin
        })
        .eq("id", gymId);

      if (updateError) throw updateError;

      if (data.modalidades) {
        const { error: deleteError } = await supabase
          .from("academia_modalidades")
          .delete()
          .eq("academia_id", gymId);

        if (deleteError) throw deleteError;

        if (data.modalidades.length > 0) {
          const { error: insertError } = await supabase
            .from("academia_modalidades")
            .insert(
              data.modalidades.map((modalidadeId: string) => ({
                academia_id: gymId,
                modalidade_id: modalidadeId
              }))
            );

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso",
      });

      fetchGym();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as alterações.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankDataSubmit = async (formData: any) => {
    if (!gymId) return;

    try {
      console.log('Salvando dados bancários:', formData);
      const { error } = await supabase
        .from("academia_dados_bancarios")
        .upsert({
          academia_id: gymId,
          ...formData
        }, {
          onConflict: 'academia_id'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados bancários salvos com sucesso",
      });

      await fetchBankData();
    } catch (error: any) {
      console.error('Erro ao salvar dados bancários:', error);
      toast({
        variant: "destructive",
<<<<<<< HEAD
        title: "Erro ao salvar",
=======
        title: "Erro",
>>>>>>> main
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!gym) {
    return <div>Academia não encontrada.</div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
        <TabsTrigger value="schedule">Horários</TabsTrigger>
        <TabsTrigger value="modalities">Modalidades</TabsTrigger>
        <TabsTrigger value="photos">Fotos</TabsTrigger>
        <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <TabsContent value="basic">
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
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <OperatingHoursForm
                register={register}
                watch={watch}
                setValue={setValue}
                replicateHours={replicateHours}
                setReplicateHours={setReplicateHours}
              />
              <Button type="submit" className="mt-4" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Horários"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modalities">
          <Card>
            <CardHeader>
              <CardTitle>Modalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <ModalitiesForm
                register={register}
                errors={errors}
                modalidades={modalidades}
              />
              <Button type="submit" className="mt-4" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Modalidades"}
              </Button>
            </CardContent>
=======
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
>>>>>>> main
          </Card>
        </TabsContent>

        <TabsContent value="photos">
<<<<<<< HEAD
          <Card>
            <CardHeader>
              <CardTitle>Fotos da Academia</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhotosDialogOpen(true)}
              >
                Gerenciar Fotos
              </Button>

              <div className="grid grid-cols-3 gap-4 mt-4">
                {Array.isArray(gym?.fotos) && gym.fotos.map((foto: string, index: number) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={`${supabase.supabaseUrl}/storage/v1/object/public/academy-images/${foto}`}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
=======
          <PhotosTab 
            fotos={academia.fotos} 
            onOpenPhotosDialog={() => setIsPhotosDialogOpen(true)} 
          />
>>>>>>> main
        </TabsContent>

<<<<<<< HEAD
        <TabsContent value="bank">
          <BankDataForm
            initialData={bankData}
            onSubmit={handleBankDataSubmit}
          />
        </TabsContent>
      </form>
=======
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
>>>>>>> main

      <GymPhotosDialog
        open={isPhotosDialogOpen}
        onOpenChange={setIsPhotosDialogOpen}
<<<<<<< HEAD
        gymId={gymId}
        fotos={gym.fotos}
        onSuccess={() => {
          setIsPhotosDialogOpen(false);
          fetchGym();
        }}
=======
        gymId={academia.id}
        onSuccess={onSuccess}
        fotos={academia.fotos}
>>>>>>> main
      />
    </Tabs>
  );
}
