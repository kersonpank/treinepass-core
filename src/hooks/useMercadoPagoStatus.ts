
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInterval } from './use-interval';

interface MercadoPagoEnvironmentVars {
  PUBLIC_KEY: string;
  ACCESS_TOKEN: string;
  SANDBOX: string;
  SITE_URL: string;
}

interface UseMercadoPagoStatusReturn {
  envVariables: MercadoPagoEnvironmentVars;
  statusOk: boolean;
}

export function useMercadoPagoStatus(): UseMercadoPagoStatusReturn {
  const [envVariables, setEnvVariables] = useState<MercadoPagoEnvironmentVars>({
    PUBLIC_KEY: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '',
    ACCESS_TOKEN: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '',
    SANDBOX: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX || 'true',
    SITE_URL: import.meta.env.VITE_PUBLIC_SITE_URL || ''
  });

  const [statusOk, setStatusOk] = useState<boolean>(false);

  // Check if Mercado Pago is properly configured
  useEffect(() => {
    // Basic validation of environment variables
    const isConfigured = !!(envVariables.PUBLIC_KEY && envVariables.ACCESS_TOKEN);
    setStatusOk(isConfigured);
  }, [envVariables]);

  return {
    envVariables,
    statusOk
  };
}
