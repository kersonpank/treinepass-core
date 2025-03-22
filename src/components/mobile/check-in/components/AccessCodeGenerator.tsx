import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AccessCodeGeneratorProps {
  academiaId: string;
  onSuccess: (code: string) => void;
  onNoPlan: () => void;
}

export function AccessCodeGenerator({ academiaId, onSuccess, onNoPlan }: AccessCodeGeneratorProps) {
  useEffect(() => {
    const generateCode = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) {
          toast.error("Usuário não autenticado");
          return;
        }

        // Verificar se o usuário tem uma assinatura ativa
        const { data: hasActiveSubscription, error: subscriptionError } = await supabase
          .from('user_plan_subscriptions')
          .select('id')
          .eq('user_id', session.session.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscriptionError || !hasActiveSubscription) {
          onNoPlan();
          return;
        }

        // Gerar código de check-in
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Salvar o código no banco
        const { error: saveError } = await supabase
          .from('check_in_codes')
          .insert({
            code,
            user_id: session.session.user.id,
            academia_id: academiaId,
            status: 'pending'
          });

        if (saveError) {
          toast.error("Erro ao gerar código de acesso");
          return;
        }

        onSuccess(code);
      } catch (error) {
        toast.error("Erro ao gerar código de acesso");
        console.error("Error generating access code:", error);
      }
    };

    generateCode();
  }, [academiaId, onSuccess, onNoPlan]);

  return null;
}
