
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserDataForm } from "./forms/UserDataForm";
import { GymDataForm } from "./forms/GymDataForm";
import { OperatingHoursForm } from "./forms/OperatingHoursForm";
import { ModalitiesForm } from "./forms/ModalitiesForm";
import { FileUploadsForm } from "./forms/FileUploadsForm";
<<<<<<< HEAD
import { BankDataForm } from "./forms/BankDataForm";
=======
import { BankDetailsForm } from "./forms/BankDetailsForm";
import { Card } from "@/components/ui/card";
>>>>>>> main
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GymFormData {
  // Dados do usuário
  email: string;
  password: string;
  full_name: string;

  // Dados da academia
  nome: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  horario_funcionamento: {
    [key: string]: { abertura: string; fechamento: string };
  };
  modalidades: string[];
  fotos: FileList;
  documentos: FileList;

  // Dados bancários
<<<<<<< HEAD
  dados_bancarios: {
    titular_nome: string;
    titular_cpf_cnpj: string;
    titular_tipo: "PF" | "PJ";
    metodo_preferencial: "PIX" | "TRANSFERENCIA";
    chave_pix?: string;
    tipo_chave_pix?: "CPF" | "CNPJ" | "EMAIL" | "CELULAR" | "ALEATORIA";
    banco_codigo?: string;
    banco_nome?: string;
    agencia?: string;
    agencia_digito?: string;
    conta?: string;
    conta_digito?: string;
    tipo_conta?: "CORRENTE" | "POUPANCA";
  };
=======
  titular_nome: string;
  titular_cpf_cnpj: string;
  titular_tipo: 'PF' | 'PJ';
  banco_codigo?: string;
  banco_nome?: string;
  agencia?: string;
  agencia_digito?: string;
  conta?: string;
  conta_digito?: string;
  tipo_conta?: 'corrente' | 'poupanca';
  chave_pix?: string;
  tipo_chave_pix?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  metodo_preferencial: 'PIX' | 'TRANSFERENCIA';
>>>>>>> main
}

interface GymRegistrationFormProps {
  onSubmit: (data: GymFormData) => Promise<void>;
  isSubmitting: boolean;
  modalidades?: { id: string; nome: string }[];
}

export function GymRegistrationForm({ onSubmit, isSubmitting, modalidades }: GymRegistrationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GymFormData>();

<<<<<<< HEAD
  const [replicateHours, setReplicateHours] = useState(false);
  const [activeTab, setActiveTab] = useState("user");

  const handleBankDataSubmit = async (bankData: any) => {
    setValue("dados_bancarios", bankData);
    setActiveTab("files"); // Avança para a próxima etapa
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="user">Responsável</TabsTrigger>
          <TabsTrigger value="gym">Academia</TabsTrigger>
          <TabsTrigger value="schedule">Horários</TabsTrigger>
          <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <UserDataForm register={register} errors={errors} />
          <Button type="button" onClick={() => setActiveTab("gym")} className="mt-4">
            Próximo
          </Button>
        </TabsContent>

        <TabsContent value="gym">
          <GymDataForm register={register} errors={errors} />
          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setActiveTab("user")}>
              Anterior
            </Button>
            <Button type="button" onClick={() => setActiveTab("schedule")}>
              Próximo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <OperatingHoursForm
            register={register}
            watch={watch}
            setValue={setValue}
            replicateHours={replicateHours}
            setReplicateHours={setReplicateHours}
          />
          <ModalitiesForm register={register} errors={errors} modalidades={modalidades} />
          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setActiveTab("gym")}>
              Anterior
            </Button>
            <Button type="button" onClick={() => setActiveTab("bank")}>
              Próximo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bank">
          <BankDataForm onSubmit={handleBankDataSubmit} />
          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setActiveTab("schedule")}>
              Anterior
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="files">
          <FileUploadsForm register={register} errors={errors} />
          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setActiveTab("bank")}>
              Anterior
            </Button>
            <Button
              type="submit"
              className="w-full bg-[#0125F0] hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar Academia"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
=======
  const [currentStep, setCurrentStep] = useState("basic");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={currentStep} onValueChange={setCurrentStep}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="schedule">Horários</TabsTrigger>
          <TabsTrigger value="modalities">Modalidades</TabsTrigger>
          <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-6">
            <UserDataForm register={register} errors={errors} />
            <GymDataForm register={register} errors={errors} />
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="p-6">
            <OperatingHoursForm
              register={register}
              watch={watch}
              setValue={setValue}
              replicateHours={false}
              setReplicateHours={() => {}}
            />
          </Card>
        </TabsContent>

        <TabsContent value="modalities">
          <Card className="p-6">
            <ModalitiesForm register={register} errors={errors} modalidades={modalidades} />
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card className="p-6">
            <BankDetailsForm register={register} errors={errors} />
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6">
            <FileUploadsForm register={register} errors={errors} />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const steps = ["basic", "schedule", "modalities", "bank", "documents"];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1]);
            }
          }}
          disabled={currentStep === "basic"}
        >
          Anterior
        </Button>

        {currentStep === "documents" ? (
          <Button
            type="submit"
            className="bg-[#0125F0] hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar Academia"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              const steps = ["basic", "schedule", "modalities", "bank", "documents"];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}
          >
            Próximo
          </Button>
        )}
      </div>
>>>>>>> main
    </form>
  );
}
