
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
    // Verificar se o SDK já está carregado
    if ((window as any).MercadoPago) {
      console.log('MercadoPago SDK já está disponível no window');
      setIsLoaded(true);
      setIsLoading(false);
      
      try {
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
      return;
    }

    const loadSdk = async () => {
      try {
        setIsLoading(true);
        
        // Carregar SDK do Mercado Pago
        await new Promise<void>((resolve, reject) => {
          console.log('Carregando MercadoPago SDK...');
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = () => {
            console.log('MercadoPago SDK carregado com sucesso');
            resolve();
          };
          script.onerror = (error) => {
            console.error('Erro ao carregar MercadoPago SDK:', error);
            reject(new Error('Falha ao carregar Mercado Pago SDK'));
          };
          document.body.appendChild(script);
        });

        setIsLoaded(true);
        
        // Inicializar o SDK
        const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Chave pública do Mercado Pago não encontrada');
        }
        
        console.log('Inicializando Mercado Pago com a chave:', publicKey.substring(0, 10) + '...');
        const mpInstance = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
        setMercadoPagoInstance(mpInstance);
      } catch (err: any) {
        console.error('Erro em useMercadoPagoSdk:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSdk();
  }, []);

  return { isLoaded, isLoading, error, mercadoPagoInstance };
}

export default useMercadoPagoSdk;
