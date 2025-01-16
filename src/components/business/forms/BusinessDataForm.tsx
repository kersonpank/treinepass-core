import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cnpj } from "cpf-cnpj-validator";
import { Progress } from "@/components/ui/progress";
import zxcvbn from "zxcvbn";

interface BusinessDataFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: any;
}

export function BusinessDataForm({ register, errors, watch }: BusinessDataFormProps) {
  const password = watch("password", "");
  const passwordStrength = zxcvbn(password);
  
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="company_name">Razão Social</Label>
        <Input
          id="company_name"
          {...register("company_name", {
            required: "Razão social é obrigatória",
            minLength: {
              value: 3,
              message: "Razão social deve ter no mínimo 3 caracteres",
            },
          })}
        />
        {errors.company_name && (
          <p className="text-sm text-red-500 mt-1">{errors.company_name.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="trading_name">Nome Fantasia</Label>
        <Input
          id="trading_name"
          {...register("trading_name", {
            required: "Nome fantasia é obrigatório",
          })}
        />
        {errors.trading_name && (
          <p className="text-sm text-red-500 mt-1">{errors.trading_name.message as string}</p>
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
          onChange={(e) => {
            e.target.value = formatCNPJ(e.target.value);
          }}
          maxLength={18}
        />
        {errors.cnpj && (
          <p className="text-sm text-red-500 mt-1">{errors.cnpj.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="inscricao_estadual">Inscrição Estadual (opcional)</Label>
        <Input
          id="inscricao_estadual"
          {...register("inscricao_estadual")}
        />
      </div>

      <div>
        <Label htmlFor="email">E-mail Corporativo</Label>
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
          <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
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
              value: 8,
              message: "Senha deve ter no mínimo 8 caracteres",
            },
          })}
        />
        {password && (
          <div className="mt-2">
            <Progress value={passwordStrength.score * 25} className="h-2" />
            <p className="text-sm mt-1">
              Força da senha: {
                ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"][
                  passwordStrength.score
                ]
              }
            </p>
          </div>
        )}
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
        )}
      </div>
    </div>
  );
}