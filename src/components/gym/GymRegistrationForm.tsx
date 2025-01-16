import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cnpj } from "cpf-cnpj-validator";

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
    formState: { errors },
  } = useForm<GymFormData>();

  const diasSemana = [
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
    "domingo",
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados do Usuário */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados do Responsável</h3>
        
        <div>
          <Label htmlFor="full_name">Nome Completo</Label>
          <Input
            id="full_name"
            {...register("full_name", { 
              required: "Nome é obrigatório",
              minLength: {
                value: 3,
                message: "Nome deve ter pelo menos 3 caracteres"
              }
            })}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
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
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            {...register("password", {
              required: "Senha é obrigatória",
              minLength: {
                value: 6,
                message: "Senha deve ter pelo menos 6 caracteres"
              }
            })}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      {/* Dados da Academia */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados da Academia</h3>
        
        <div>
          <Label htmlFor="nome">Nome da Academia</Label>
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
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            {...register("telefone", { required: "Telefone é obrigatório" })}
          />
          {errors.telefone && (
            <p className="text-sm text-red-500">{errors.telefone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="endereco">Endereço</Label>
          <Textarea
            id="endereco"
            {...register("endereco", { required: "Endereço é obrigatório" })}
          />
          {errors.endereco && (
            <p className="text-sm text-red-500">{errors.endereco.message}</p>
          )}
        </div>
      </div>

      {/* Operating Hours */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Horários de Funcionamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diasSemana.map((dia) => (
            <div key={dia} className="space-y-2">
              <Label>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  {...register(`horario_funcionamento.${dia}.abertura` as const, {
                    required: true,
                  })}
                />
                <Input
                  type="time"
                  {...register(
                    `horario_funcionamento.${dia}.fechamento` as const,
                    { required: true }
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modalities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Modalidades Oferecidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modalidades?.map((modalidade) => (
            <div key={modalidade.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={modalidade.id}
                value={modalidade.id}
                {...register("modalidades", {
                  required: "Selecione pelo menos uma modalidade",
                })}
                className="w-4 h-4 text-[#0125F0] border-gray-300 rounded focus:ring-[#0125F0]"
              />
              <Label htmlFor={modalidade.id}>{modalidade.nome}</Label>
            </div>
          ))}
        </div>
        {errors.modalidades && (
          <p className="text-sm text-red-500">{errors.modalidades.message}</p>
        )}
      </div>

      {/* File Uploads */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fotos">Fotos do Espaço</Label>
          <Input
            id="fotos"
            type="file"
            accept="image/*"
            multiple
            {...register("fotos", { required: "Envie pelo menos uma foto" })}
          />
          {errors.fotos && (
            <p className="text-sm text-red-500">{errors.fotos.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="documentos">Documentos</Label>
          <Input
            id="documentos"
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            {...register("documentos", {
              required: "Envie os documentos necessários",
            })}
          />
          {errors.documentos && (
            <p className="text-sm text-red-500">{errors.documentos.message}</p>
          )}
        </div>
      </div>

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
