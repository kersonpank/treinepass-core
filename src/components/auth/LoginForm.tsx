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
    try {
      console.log("Validando tipo de usuário:", { userId, requestedType });
      
      // Buscar o tipo do usuário nos metadados
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Erro ao obter dados do usuário:", userError);
        return false;
      }

      const userType = user.user_metadata?.user_type;
      console.log("Tipo de usuário nos metadados:", userType);

      // Se não encontrou tipo nos metadados, buscar na tabela
      if (!userType) {
        const { data: userTypes, error } = await supabase
          .from('user_types')
          .select('type')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error("Erro ao verificar tipo de usuário:", error);
          return false;
        }

        console.log("Tipo de usuário na tabela:", userTypes?.type);
        return userTypes?.type === requestedType;
      }

      console.log("Comparando tipos:", { userType, requestedType });
      return userType === requestedType;
    } catch (error) {
      console.error("Erro ao validar tipo de usuário:", error);
      return false;
    }
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

          if (gymError || !gymRoles?.gym_id) {
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

      if (error) {
        console.error("Erro de autenticação:", error);
        throw new Error("Email ou senha incorretos");
      }

      if (!authData.user) {
        throw new Error("Usuário não encontrado");
      }

      const isValidType = await validateUserType(authData.user.id, data.accountType);
      if (!isValidType) {
        throw new Error("Tipo de conta não corresponde ao perfil do usuário");
      }

      await handleRedirectLoggedUser(authData.user.id, data.accountType);

    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message,
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
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido",
              },
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