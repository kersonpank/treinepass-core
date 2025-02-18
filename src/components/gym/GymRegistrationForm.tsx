
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserDataForm } from "./forms/UserDataForm";
import { GymDataForm } from "./forms/GymDataForm";
import { OperatingHoursForm } from "./forms/OperatingHoursForm";
import { ModalitiesForm } from "./forms/ModalitiesForm";
import { FileUploadsForm } from "./forms/FileUploadsForm";
import { BankDataForm } from "./forms/BankDataForm";
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
    </form>
  );
}
