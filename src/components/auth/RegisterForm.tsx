import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CPFInput } from "./form/CPFInput";
import { DateInput } from "./form/DateInput";
import { UserFormData } from "./types/auth";
import { CepInput } from "@/components/shared/CepInput";
import { Separator } from "@/components/ui/separator";

interface RegisterFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RegisterForm({ onSubmit, isSubmitting }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<UserFormData>();
  
  // Estado para controlar a exibição dos campos de endereço
  const cepLoading = watch('cep_loading', false);

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error?.message?.includes("CPF já cadastrado")) {
        setError("cpf", {
          type: "manual",
          message: "Este CPF já está cadastrado",
        });
      } else {
        throw error;
      }
    }
  };

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Apply the phone mask (99) 99999-9999
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else {
      // If more than 11 digits, truncate
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input
          id="full_name"
          {...register("full_name", {
            required: "Nome é obrigatório",
            minLength: {
              value: 3,
              message: "Nome deve ter no mínimo 3 caracteres",
            },
          })}
        />
        {errors.full_name && (
          <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
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
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
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
              message: "Senha deve ter no mínimo 6 caracteres",
            },
          })}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone", {
            required: "Telefone é obrigatório",
            pattern: {
              value: /^\(\d{2}\) \d{5}-\d{4}$/,
              message: "Telefone inválido. Use o formato (99) 99999-9999",
            },
          })}
          placeholder="(99) 99999-9999"
          onChange={(e) => {
            const formattedValue = formatPhone(e.target.value);
            e.target.value = formattedValue;
            setValue("phone", formattedValue, { shouldValidate: true });
          }}
          maxLength={15}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      <CPFInput register={register} errors={errors} />
      <DateInput register={register} errors={errors} />

      <Separator className="my-4" />
      <h3 className="text-lg font-semibold mb-4">Endereço</h3>
      
      <CepInput register={register} errors={errors} setValue={setValue} />
      
      {cepLoading && (
        <div className="text-sm text-blue-500 mt-2 mb-4">
          Buscando endereço...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="street">Rua</Label>
          <Controller
            control={control}
            name="street"
            defaultValue=""
            render={({ field }) => <Input id="street" {...field} />}
          />
        </div>

        <div>
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            {...register("number")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          {...register("complement")}
          placeholder="Apartamento, bloco, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Controller
            control={control}
            name="neighborhood"
            defaultValue=""
            render={({ field }) => <Input id="neighborhood" {...field} />}
          />
        </div>

        <div>
          <Label htmlFor="city">Cidade</Label>
          <Controller
            control={control}
            name="city"
            defaultValue=""
            render={({ field }) => <Input id="city" {...field} />}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="state">Estado</Label>
        <Controller
          control={control}
          name="state"
          defaultValue=""
          render={({ field }) => <Input id="state" {...field} />}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#0125F0] hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cadastrando..." : "Cadastrar"}
      </Button>

      <p className="text-sm text-gray-500 text-center mt-4">
        Após o cadastro, você receberá um e-mail de confirmação.
        Por favor, verifique sua caixa de entrada.
      </p>
    </form>
  );
}
