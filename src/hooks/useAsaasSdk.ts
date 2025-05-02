
import { useState, useEffect } from 'react';

/**
 * Hook para carregar o SDK do Asaas
 */
export function useAsaasSdk() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Verificar se o SDK já está carregado
    if ((window as any).Asaas) {
      setIsLoaded(true);
      return;
    }

    const loadSdk = async () => {
      try {
        setIsLoading(true);
        
        // Carregar script do SDK do Asaas
        await new Promise<void>((resolve, reject) => {
          console.log('Carregando Asaas SDK...');
          const script = document.createElement('script');
          script.src = 'https://assets.asaas.com/assets/multistep-checkout/main.js';
          script.async = true;
          script.onload = () => {
            console.log('Asaas SDK carregado com sucesso');
            resolve();
          };
          script.onerror = (error) => {
            console.error('Erro ao carregar Asaas SDK:', error);
            reject(new Error('Falha ao carregar Asaas SDK'));
          };
          document.body.appendChild(script);
        });

        setIsLoaded(true);
      } catch (err: any) {
        console.error('Erro em useAsaasSdk:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSdk();
  }, []);

  return { isLoaded, isLoading, error };
}

export default useAsaasSdk;
