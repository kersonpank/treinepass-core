
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AccessCodeGeneratorProps {
  academiaId: string;
  onSuccess: (code: string, limits: any) => void;
  onNoPlan: () => void;
}

export function AccessCodeGenerator({ academiaId, onSuccess, onNoPlan }: AccessCodeGeneratorProps) {
  useEffect(() => {
    const generateCode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Você precisa estar logado para fazer check-in");
          return;
        }

        const { data: limitsData } = await supabase.rpc('validate_check_in_rules', {
          p_user_id: user.id,
          p_academia_id: academiaId
        });

        if (limitsData?.[0]) {
          if (!limitsData[0].can_check_in) {
            onNoPlan();
            return;
          }

          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          onSuccess(code, {
            remainingDaily: limitsData[0].remaining_daily,
            remainingWeekly: limitsData[0].remaining_weekly,
            remainingMonthly: limitsData[0].remaining_monthly
          });
        }
      } catch (error: any) {
        toast.error("Erro ao gerar código", {
          description: error.message,
        });
      }
    };

    generateCode();
  }, [academiaId, onSuccess, onNoPlan]);

  return null;
}
