import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserDataForm } from "./forms/UserDataForm";
import { GymDataForm } from "./forms/GymDataForm";
import { OperatingHoursForm } from "./forms/OperatingHoursForm";
import { ModalitiesForm } from "./forms/ModalitiesForm";
import { FileUploadsForm } from "./forms/FileUploadsForm";

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <UserDataForm register={register} errors={errors} />
      <GymDataForm register={register} errors={errors} />
      <OperatingHoursForm
        register={register}
        watch={watch}
        setValue={setValue}
        replicateHours={replicateHours}
        setReplicateHours={setReplicateHours}
      />
      <ModalitiesForm register={register} errors={errors} modalidades={modalidades} />
      <FileUploadsForm register={register} errors={errors} />

      <Button
        type="submit"
        className="w-full bg-[#0125F0] hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cadastrando..." : "Cadastrar Academia"}
      </Button>
    </form>
  );
}