
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsePaymentStatusProps {
  paymentId?: string;
  subscriptionId?: string;
  interval?: number; // intervalo em milissegundos
  onPaymentConfirmed?: (paymentData: any) => void;
}

export function usePaymentStatus({
  paymentId,
  subscriptionId,
  interval = 5000, // 5 segundos por padrão
  onPaymentConfirmed
}: UsePaymentStatusProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Função para verificar o status do pagamento
  const checkStatus = async () => {
    if (!paymentId && !subscriptionId) return;

    try {
      setIsLoading(true);
      setError(null);

      let result;

      // Se tivermos um ID de pagamento Asaas, verificar diretamente na API
      if (paymentId) {
        const { data, error } = await supabase.functions.invoke(
          'asaas-api',
          {
            body: {
              action: 'sdkCheckPaymentStatus',
              data: { paymentId }
            }
          }
        );

        if (error) throw error;
        result = data;
      } 
      // Se tivermos um ID de assinatura, buscar no banco de dados
      else if (subscriptionId) {
        // Buscar os detalhes da assinatura
        const { data: subscription, error: subError } = await supabase
          .from('user_plan_subscriptions')
          .select('*')
          .eq('id', subscriptionId)
          .single();

        if (subError) throw subError;
        result = { status: subscription.payment_status, subscription };
      }

      if (result) {
        setStatus(result.status);
        setPaymentData(result);

        // Se o pagamento foi confirmado, chamar o callback
        if (
          result.status === 'RECEIVED' || 
          result.status === 'CONFIRMED' || 
          result.status === 'paid' || 
          result.status === 'active'
        ) {
          if (onPaymentConfirmed) {
            onPaymentConfirmed(result);
          }
          // Parar de verificar se o pagamento foi confirmado
          setIsVerifying(false);
        }
      }

    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar verificação periódica quando solicitado
  useEffect(() => {
    let intervalId: number | undefined;

    if (isVerifying && (paymentId || subscriptionId)) {
      // Verificar imediatamente
      checkStatus();
      
      // E então em intervalos
      intervalId = window.setInterval(checkStatus, interval);
    }

    // Limpar intervalo quando o componente for desmontado ou quando parar de verificar
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isVerifying, paymentId, subscriptionId, interval]);

  return {
    status,
    isLoading,
    error,
    paymentData,
    checkStatus,
    isVerifying,
    setIsVerifying
  };
}
