
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useInterval } from "@/hooks/use-interval";

interface UsePaymentStatusCheckerProps {
  paymentId: string | undefined;
  onPaymentConfirmed: () => void;
}

export function usePaymentStatusChecker({ 
  paymentId, 
  onPaymentConfirmed 
}: UsePaymentStatusCheckerProps) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  useInterval(
    async () => {
      if (!paymentId) return;

      try {
        const { data: payment, error } = await supabase
          .from("asaas_payments")
          .select("status")
          .eq("asaas_id", paymentId)
          .single();

        if (error) {
          console.error("Erro ao verificar status do pagamento:", error);
          return;
        }

        if (payment?.status === "CONFIRMED" || payment?.status === "RECEIVED") {
          toast({
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada com sucesso.",
          });
          
          onPaymentConfirmed();
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      }
    },
    isVerifying ? 5000 : null
  );

  return {
    isVerifying,
    setIsVerifying,
  };
}
