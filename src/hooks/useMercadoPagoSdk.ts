
import { useState, useEffect } from 'react';

/**
 * Hook to load and initialize the Mercado Pago SDK
 */
export function useMercadoPagoSdk() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if SDK is already loaded
    if ((window as any).MercadoPago) {
      setIsLoaded(true);
      return;
    }

    const loadSdk = async () => {
      try {
        setIsLoading(true);
        
        // Load Mercado Pago SDK script
        await new Promise<void>((resolve, reject) => {
          console.log('Loading MercadoPago SDK...');
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = () => {
            console.log('MercadoPago SDK loaded successfully');
            resolve();
          };
          script.onerror = (error) => {
            console.error('Error loading MercadoPago SDK:', error);
            reject(new Error('Failed to load Mercado Pago SDK'));
          };
          document.body.appendChild(script);
        });

        setIsLoaded(true);
      } catch (err: any) {
        console.error('Error in useMercadoPagoSdk:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSdk();
  }, []);

  return { isLoaded, isLoading, error };
}

export default useMercadoPagoSdk;
