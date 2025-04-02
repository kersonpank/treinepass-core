
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInterval } from '@/hooks/use-interval';
import { useToast } from '@/hooks/use-toast';

interface PaymentStatusCheckerProps {
  paymentId?: string;
  onPaymentConfirmed?: () => void;
  checkInterval?: number;
}

export function usePaymentStatusChecker({
  paymentId,
  onPaymentConfirmed,
  checkInterval = 5000
}: PaymentStatusCheckerProps) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Use interval to check payment status
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
          console.error("Error checking payment status:", error);
          return;
        }

        if (payment?.status === "CONFIRMED" || 
            payment?.status === "RECEIVED" || 
            payment?.status === "RECEIVED_IN_CASH") {
          
          setStatus("confirmed");
          setIsVerifying(false);
          
          toast({
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada com sucesso.",
          });
          
          if (onPaymentConfirmed) {
            onPaymentConfirmed();
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    },
    isVerifying ? checkInterval : null
  );

  useEffect(() => {
    if (paymentId) {
      setIsVerifying(true);
    } else {
      setIsVerifying(false);
    }
  }, [paymentId]);

  return {
    isVerifying,
    setIsVerifying,
    status
  };
}
