
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para verificar o status do Mercado Pago no ambiente
 */
export function useMercadoPagoStatus() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [envVariables, setEnvVariables] = useState<Record<string, string | undefined>>({});
  const [statusOk, setStatusOk] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsCheckingStatus(true);
        
        // Coletar variáveis de ambiente relacionadas ao Mercado Pago
        const variables = {
          PUBLIC_KEY: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
          ACCESS_TOKEN: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN,
          SANDBOX: import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX,
          SITE_URL: import.meta.env.VITE_PUBLIC_SITE_URL,
        };
        
        // Vamos mascarar parte dos valores para segurança
        const maskedVariables = Object.entries(variables).reduce((acc, [key, value]) => {
          if (!value) {
            acc[key] = undefined;
          } else if (typeof value === 'string' && value.length > 10) {
            acc[key] = `${value.substring(0, 5)}...${value.substring(value.length - 5)}`;
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string | undefined>);
        
        setEnvVariables(maskedVariables);
        
        console.log('[MercadoPagoStatus] Variáveis de ambiente:', maskedVariables);
        
        // Verificar se as chaves existem
        if (!variables.PUBLIC_KEY) {
          toast({
            title: "Configuração incompleta",
            description: "A chave pública do Mercado Pago não está configurada.",
            variant: "destructive"
          });
          setStatusOk(false);
        } else if (!variables.ACCESS_TOKEN) {
          toast({
            title: "Configuração incompleta",
            description: "O token de acesso do Mercado Pago não está configurado.",
            variant: "destructive"
          });
          setStatusOk(false);
        } else {
          console.log('[MercadoPagoStatus] Configuração do Mercado Pago parece OK');
          setStatusOk(true);
        }
        
      } catch (error: any) {
        console.error('[MercadoPagoStatus] Erro ao verificar status:', error);
        setStatusOk(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    checkStatus();
  }, [toast]);
  
  return { isCheckingStatus, envVariables, statusOk };
}

export default useMercadoPagoStatus;
