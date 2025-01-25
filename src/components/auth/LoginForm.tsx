import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Loader2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccountTypeSelect } from "./AccountTypeSelect";

interface LoginFormData {
  credential: string;
  password: string;
  accountType: string;
}

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormData>({
    defaultValues: {
      accountType: 'individual'
    }
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateUserType = async (userId: string, requestedType: string) => {
    const { data: userTypes, error } = await supabase
      .from('user_types')
      .select('type')
      .eq('user_id', userId);

    if (error) {
      console.error("Erro ao verificar tipos de usuário:", error);
      return false;
    }

    // Se não encontrou nenhum tipo, só permite acesso como individual
    if (!userTypes || userTypes.length === 0) {
      return requestedType === 'individual';
    }

    // Verifica se o usuário tem o tipo solicitado
    const hasRequestedType = userTypes.some(ut => ut.type === requestedType);
    
    // Se está tentando acessar como individual mas tem outros tipos, não permite
    if (requestedType === 'individual' && userTypes.some(ut => ut.type !== 'individual')) {
      return false;
    }

    return hasRequestedType;
  };

  const handleRedirectLoggedUser = async (userId: string, accountType: string) => {
    try {
      console.log("Redirecionando usuário:", { userId, accountType });
      
      const isValidType = await validateUserType(userId, accountType);
      if (!isValidType) {
        throw new Error("Tipo de conta não corresponde ao perfil do usuário");
      }

      switch (accountType) {
        case 'individual':
          navigate('/app');
          break;
        case 'business':
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
      console.error("Erro ao redirecionar usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao redirecionar usuário",
      });
      // Em caso de erro de tipo, fazer logout
      await supabase.auth.signOut();
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      console.log("Tentando login:", { email: data.credential, accountType: data.accountType });
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.credential,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        await handleRedirectLoggedUser(authData.user.id, data.accountType);
      }

    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
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
        <AccountTypeSelect onValueChange={(value) => setValue("accountType", value)} />
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