
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para carregar e inicializar o SDK do Mercado Pago
 */
export function useMercadoPagoSdk() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mercadoPagoInstance, setMercadoPagoInstance] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSdk = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se o SDK já está carregado
        if ((window as any).MercadoPago) {
          console.log('[useMercadoPagoSdk] SDK já está disponível no window');
          setIsLoaded(true);
          
          const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
          if (!publicKey) {
            throw new Error('Chave pública do Mercado Pago não encontrada');
          }
          
          const mpInstance = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
          setMercadoPagoInstance(mpInstance);
          setIsLoading(false);
          return;
        }

        // Carregar o script do Mercado Pago SDK
        console.log('[useMercadoPagoSdk] Carregando SDK...');
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        
        script.onload = () => {
          console.log('[useMercadoPagoSdk] SDK carregado com sucesso');
          setIsLoaded(true);
          
          // Inicializar o SDK com a chave pública
          const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
          if (!publicKey) {
            const errorMsg = 'Chave pública do Mercado Pago não encontrada';
            console.error('[useMercadoPagoSdk] ' + errorMsg);
            setError(new Error(errorMsg));
            toast({
              title: "Erro de configuração",
              description: "Não foi possível inicializar o pagamento. Contate o suporte.",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
          
          console.log('[useMercadoPagoSdk] Inicializando com chave pública');
          try {
            const mpInstance = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
            setMercadoPagoInstance(mpInstance);
            setIsLoading(false);
          } catch (initError: any) {
            console.error('[useMercadoPagoSdk] Erro ao inicializar:', initError);
            setError(initError);
            setIsLoading(false);
            toast({
              title: "Erro ao inicializar pagamento",
              description: initError.message || "Não foi possível inicializar o sistema de pagamento",
              variant: "destructive"
            });
          }
        };
        
        script.onerror = (event) => {
          const errorMsg = 'Falha ao carregar Mercado Pago SDK';
          console.error('[useMercadoPagoSdk] ' + errorMsg, event);
          setError(new Error(errorMsg));
          setIsLoading(false);
          toast({
            title: "Erro de carregamento",
            description: "Não foi possível carregar o sistema de pagamento. Verifique sua conexão.",
            variant: "destructive"
          });
        };
        
        document.body.appendChild(script);
      } catch (err: any) {
        console.error('[useMercadoPagoSdk] Erro:', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: "Erro inesperado",
          description: err.message || "Ocorreu um erro ao preparar o pagamento",
          variant: "destructive"
        });
      }
    };

    loadSdk();
    
    // Cleanup function
    return () => {
      // Não é possível remover o script do Mercado Pago para evitar conflitos
      // com outras partes da aplicação que possam estar usando
    };
  }, [toast]);

  return { isLoaded, isLoading, error, mercadoPagoInstance };
}

export default useMercadoPagoSdk;
