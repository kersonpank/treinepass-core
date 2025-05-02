
import { useState, useEffect } from 'react';

/**
 * Hook para carregar e inicializar o SDK do Mercado Pago
 */
export function useMercadoPagoSdk() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mercadoPagoInstance, setMercadoPagoInstance] = useState<any>(null);

  useEffect(() => {
    const loadSdk = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se o SDK já está carregado
        if ((window as any).MercadoPago) {
          console.log('MercadoPago SDK já está disponível no window');
          setIsLoaded(true);
          
          try {
            // Inicializar o SDK com a chave pública
            const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
            if (!publicKey) {
              throw new Error('Chave pública do Mercado Pago não encontrada');
            }
            
            const mpInstance = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
            setMercadoPagoInstance(mpInstance);
          } catch (err: any) {
            console.error('Erro ao inicializar Mercado Pago:', err);
            setError(err);
          }
          
          setIsLoading(false);
          return;
        }

        // Carregar o script do Mercado Pago SDK
        console.log('Carregando MercadoPago SDK...');
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        
        script.onload = () => {
          console.log('MercadoPago SDK carregado com sucesso');
          setIsLoaded(true);
          
          try {
            // Inicializar o SDK com a chave pública
            const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
            if (!publicKey) {
              throw new Error('Chave pública do Mercado Pago não encontrada');
            }
            
            console.log('Inicializando Mercado Pago com a chave:', publicKey.substring(0, 10) + '...');
            const mpInstance = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
            setMercadoPagoInstance(mpInstance);
          } catch (err: any) {
            console.error('Erro ao inicializar Mercado Pago:', err);
            setError(err);
          }
          
          setIsLoading(false);
        };
        
        script.onerror = (error) => {
          console.error('Erro ao carregar MercadoPago SDK:', error);
          setError(new Error('Falha ao carregar Mercado Pago SDK'));
          setIsLoading(false);
        };
        
        document.body.appendChild(script);
      } catch (err: any) {
        console.error('Erro em useMercadoPagoSdk:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    loadSdk();
  }, []);

  return { isLoaded, isLoading, error, mercadoPagoInstance };
}

export default useMercadoPagoSdk;
