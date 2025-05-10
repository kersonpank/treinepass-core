
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInterval } from './use-interval';

interface UseMercadoPagoStatusProps {
  paymentId?: string;
  onStatusChange?: (status: string) => void;
  checkInterval?: number;
}

export function useMercadoPagoStatus({
  paymentId,
  onStatusChange,
  checkInterval = 5000
}: UseMercadoPagoStatusProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setError(error.message);
          return;
        }
        
        if (data) {
          setStatus(data.status);
          if (onStatusChange) onStatusChange(data.status);
        }
      } catch (err) {
        console.error("Error in status check:", err);
        setError('Failed to fetch payment status');
      } finally {
        setIsChecking(false);
      }
    };
    
    fetchStatus();
  }, [paymentId]);

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
          setError(error.message);
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
    isChecking,
    status,
    error,
    setIsChecking
  };
}
