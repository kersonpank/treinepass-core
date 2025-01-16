import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
  credential: string;
  password: string;
}

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const detectCredentialType = (credential: string): 'email' | 'cpf' | 'cnpj' => {
    // Remove caracteres especiais para verificação
    const cleanCredential = credential.replace(/[^\w\s]/gi, '');
    
    // Verifica se é um email
    if (credential.includes('@')) {
      return 'email';
    }
    
    // Verifica se é um CPF (11 dígitos)
    if (cleanCredential.length === 11) {
      return 'cpf';
    }
    
    // Verifica se é um CNPJ (14 dígitos)
    if (cleanCredential.length === 14) {
      return 'cnpj';
    }
    
    return 'email'; // fallback para email
  };

  const handleRedirect = async (userId: string) => {
    // Buscar os tipos de perfil do usuário
    const { data: userTypes } = await supabase
      .from('user_types')
      .select('type')
      .eq('user_id', userId);

    if (!userTypes || userTypes.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhum perfil encontrado para este usuário",
      });
      return;
    }

    // Se houver apenas um perfil, redireciona diretamente
    if (userTypes.length === 1) {
      switch (userTypes[0].type) {
        case 'individual':
          navigate('/app');
          break;
        case 'business':
          navigate('/dashboard-empresa');
          break;
        case 'gym':
          navigate('/dashboard-academia');
          break;
        default:
          navigate('/');
      }
    } else {
      // Se houver múltiplos perfis, redireciona para a tela de seleção
      navigate('/selecionar-perfil');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const credentialType = detectCredentialType(data.credential);
      
      // Buscar o email associado ao CPF/CNPJ se necessário
      let email = data.credential;
      
      if (credentialType === 'cpf') {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('cpf', data.credential.replace(/\D/g, ''))
          .single();
          
        if (!userProfile) throw new Error('CPF não encontrado');
        
        // Get user email from auth metadata using admin functions
        const { data: userData } = await supabase.auth.admin.getUserById(userProfile.id);
        if (!userData?.user) throw new Error('Usuário não encontrado');
        email = userData.user.email;
      }
      
      if (credentialType === 'cnpj') {
        const { data: business } = await supabase
          .from('business_profiles')
          .select('user_id')
          .eq('cnpj', data.credential.replace(/\D/g, ''))
          .single();
          
        if (!business) throw new Error('CNPJ não encontrado');
        
        // Get user email from auth metadata using admin functions
        const { data: userData } = await supabase.auth.admin.getUserById(business.user_id);
        if (!userData?.user) throw new Error('Usuário não encontrado');
        email = userData.user.email;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        await handleRedirect(authData.user.id);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
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
        <Label htmlFor="credential">Email, CPF ou CNPJ</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            id="credential"
            className="pl-10"
            placeholder="Digite seu email, CPF ou CNPJ"
            {...register("credential", {
              required: "Credencial é obrigatória",
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
  );
};