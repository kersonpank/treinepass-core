import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Loader2, Home, Building2, User, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
  credential: string;
  password: string;
  accountType: string;
}

const accountTypes = [
  { id: 'individual', label: 'Usuário', icon: User },
  { id: 'business', label: 'Empresa', icon: Building2 },
  { id: 'gym', label: 'Academia', icon: Dumbbell }
];

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LoginFormData>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const selectedAccountType = watch("accountType");

  const handleRedirectLoggedUser = async (userId: string, accountType: string) => {
    try {
      switch (accountType) {
        case 'individual':
          navigate('/app');
          break;
        case 'business':
          // Verificar se o usuário tem perfil de empresa
          const { data: businessProfile, error: businessError } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (businessError || !businessProfile) {
            toast({
              variant: "destructive",
              title: "Acesso negado",
              description: "Você não tem acesso ao painel empresarial",
            });
            return;
          }
          navigate('/dashboard-empresa');
          break;
        case 'gym':
          // Verificar se o usuário tem perfil de academia
          const { data: gymRoles, error: gymError } = await supabase
            .from('user_gym_roles')
            .select('gym_id')
            .eq('user_id', userId)
            .eq('active', true)
            .maybeSingle();

          if (gymError || !gymRoles) {
            toast({
              variant: "destructive",
              title: "Acesso negado",
              description: "Você não tem acesso ao painel da academia",
            });
            return;
          }
          navigate(`/academia/${gymRoles.gym_id}`);
          break;
        default:
          navigate('/app');
      }
    } catch (error: any) {
      console.error("Error redirecting logged user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao redirecionar usuário",
      });
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (!data.accountType) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione o tipo de perfil para continuar",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.credential,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        await handleRedirectLoggedUser(authData.user.id, data.accountType);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos para o tipo de perfil selecionado"
          : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = prompt("Digite seu email para recuperar a senha:");
    if (!email) return;

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="credential">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            id="credential"
            className="pl-10"
            placeholder="Digite seu email"
            {...register("credential", {
              required: "Email é obrigatório",
            })}
          />
        </div>
        {errors.credential && (
          <p className="text-sm text-red-500 mt-1">{errors.credential.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            id="password"
            type="password"
            className="pl-10"
            placeholder="••••••••"
            {...register("password", {
              required: "Senha é obrigatória",
              minLength: {
                value: 6,
                message: "A senha deve ter pelo menos 6 caracteres",
              },
            })}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Conta</Label>
        <Select onValueChange={(value) => setValue("accountType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de conta" />
          </SelectTrigger>
          <SelectContent>
            {accountTypes.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="link"
        className="px-0 font-normal"
        onClick={handlePasswordReset}
      >
        Esqueceu sua senha?
      </Button>

      <Button
        type="submit"
        className="w-full bg-[#0125F0]"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>

      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/')}
        >
          <Home className="mr-2 h-4 w-4" />
          Voltar para página inicial
        </Button>
      </div>
    </motion.form>
  );
};