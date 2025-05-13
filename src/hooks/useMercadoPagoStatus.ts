
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInterval } from './use-interval';

interface UseMercadoPagoStatusProps {
  paymentId?: string;
  onStatusChange?: (status: string) => void;
  onPaymentConfirmed?: () => void;
  checkInterval?: number;
}

export function useMercadoPagoStatus(props?: UseMercadoPagoStatusProps) {
  // Use default empty object if props is undefined
  const { 
    paymentId, 
    onStatusChange, 
    onPaymentConfirmed, 
    checkInterval = 5000 
  } = props || {};

  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial status
  useEffect(() => {
    if (!paymentId) return;
    
    const fetchStatus = async () => {
      try {
        setIsChecking(true);
        const { data, error } = await supabase
          .from('payments')
          .select('status, metadata')
          .eq('external_id', paymentId)
          .single();
        
        if (error) {
          console.error("Error fetching payment status:", error);
          setError(new Error(error.message));
          return;
        }
        
        if (data) {
          setStatus(data.status);
          if (onStatusChange) onStatusChange(data.status);
          
          // If payment is already approved, trigger confirmation
          if (['approved', 'completed'].includes(data.status)) {
            if (onPaymentConfirmed) onPaymentConfirmed();
            setIsChecking(false);
          }
        }
      } catch (err: any) {
        console.error("Error in status check:", err);
        setError(new Error('Failed to fetch payment status'));
      } finally {
        if (!isChecking) setIsChecking(true);
      }
    };
    
    fetchStatus();
  }, [paymentId, onStatusChange, onPaymentConfirmed]);

  // Setup polling interval
  useInterval(
    async () => {
      if (!paymentId) return;
      
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('status, metadata')
          .eq('external_id', paymentId)
          .single();
        
        if (error) {
          console.error("Error checking payment status:", error);
          setError(new Error(error.message));
          return;
        }
        
        if (data) {
          const newStatus = data.status;
          
          if (newStatus !== status) {
            setStatus(newStatus);
            if (onStatusChange) onStatusChange(newStatus);
          }
          
          // If payment is approved or completed, stop checking
          if (['approved', 'completed'].includes(newStatus)) {
            if (onPaymentConfirmed) onPaymentConfirmed();
            setIsChecking(false);
          }
        }
      } catch (err) {
        console.error("Error in interval check:", err);
      }
    },
    isChecking ? checkInterval : null
  );

  return {
    isVerifying: isChecking,
    status,
    error,
    setIsVerifying: setIsChecking
  };
}

// Environment check hook
export function useMercadoPagoConfig() {
  const [envVariables, setEnvVariables] = useState({
    PUBLIC_KEY: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '',
    ACCESS_TOKEN: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '',
    SANDBOX: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX || 'true',
    SITE_URL: import.meta.env.VITE_PUBLIC_SITE_URL || ''
  });

  const [statusOk, setStatusOk] = useState<boolean>(false);

  useEffect(() => {
    const isConfigured = !!(envVariables.PUBLIC_KEY && envVariables.ACCESS_TOKEN);
    setStatusOk(isConfigured);
  }, [envVariables]);

  return {
    envVariables,
    statusOk
  };
}
