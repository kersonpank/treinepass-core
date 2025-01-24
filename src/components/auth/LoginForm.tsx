import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Loader2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormData {
  credential: string;
  password: string;
}

interface UserProfile {
  full_name: string;
  type?: string;
}

interface UserAccessType {
  type: string;
  profile_id: string;
  details: {
    gym_name?: string;
    company_name?: string;
    role?: string;
    status?: string;
  };
}

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile) {
          const { data: accessTypes, error: accessError } = await supabase
            .rpc('get_user_access_types', {
              p_user_id: session.user.id
            });

          if (accessError) throw accessError;

          setCurrentUser({
            full_name: profile.full_name || 'Usuário',
            type: accessTypes?.map(at => at.type).join(', ')
          });
        }
      } catch (error) {
        console.error("Error checking current user:", error);
      }
    };

    checkCurrentUser();
  }, []);

  const handleRedirectLoggedUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não está logado",
        });
        return;
      }

      const { data: accessTypes, error: accessError } = await supabase
        .rpc('get_user_access_types', {
          p_user_id: session.user.id
        });

      if (accessError) throw accessError;

      if (!accessTypes || accessTypes.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Nenhum perfil encontrado para este usuário",
        });
        return;
      }

      // Se houver múltiplos perfis, redireciona para a tela de seleção
      if (accessTypes.length > 1) {
        navigate('/selecionar-perfil');
        return;
      }

      // Se houver apenas um perfil, redireciona diretamente
      const accessType = accessTypes[0];
      switch (accessType.type) {
        case 'individual':
          navigate('/app');
          break;
        case 'business':
          navigate('/dashboard-empresa');
          break;
        case 'gym':
          if (accessType.profile_id) {
            navigate(`/academia/${accessType.profile_id}`);
          } else {
            navigate('/');
          }
          break;
        default:
          navigate('/');
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
    try {
      setIsLoading(true);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.credential,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        await handleRedirectLoggedUser();
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials"
          ? "Credenciais inválidas"
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
    <>
      {currentUser && (
        <Alert 
          className="mb-6 cursor-pointer hover:bg-gray-100 transition-colors" 
          onClick={handleRedirectLoggedUser}
        >
          <AlertDescription className="flex items-center justify-between">
            <span>
              Olá {currentUser.full_name}
              {currentUser.type && ` (${currentUser.type})`}! Você já está logado.
            </span>
            <span className="text-sm text-muted-foreground">
              Clique para acessar →
            </span>
          </AlertDescription>
        </Alert>
      )}
      
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
      </motion.form>

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
    </>
  );
};
