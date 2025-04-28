
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractAsaasApiToken } from '@/utils/asaas-helpers';

interface TestApiKeyProps {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

export function useAsaasApiTest() {
  const [isLoading, setIsLoading] = useState(false);

  const testApiKey = async ({ apiKey, environment }: TestApiKeyProps) => {
    try {
      setIsLoading(true);
      console.log(`Testing Asaas API key in ${environment} environment`);
      
      // Extract proper token format
      const cleanApiKey = extractAsaasApiToken(apiKey);
      
      if (!cleanApiKey) {
        console.error("Invalid API key format:", apiKey);
        return {
          success: false,
          message: "Formato de API key inválido. Verifique se você copiou a chave corretamente."
        };
      }
      
      console.log("Using cleaned API key (length):", cleanApiKey.length);
      
      // Call the edge function to test the API key
      const { data, error } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: 'testApiKey',
            data: {
              apiKey: cleanApiKey,
              environment: environment
            }
          }
        }
      );

      if (error) {
        console.error("Error testing API key:", error);
        return {
          success: false,
          message: `Erro ao testar a chave API: ${error.message}`
        };
      }

      if (!data?.success) {
        console.error("API key test failed:", data);
        return {
          success: false,
          message: data?.message || "Erro desconhecido ao testar a chave API"
        };
      }

      return {
        success: true,
        message: "Conexão com a API do Asaas estabelecida com sucesso!"
      };
    } catch (error: any) {
      console.error("Error testing API key:", error);
      return {
        success: false,
        message: `Erro ao testar chave API: ${error.message}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testApiKey,
    isLoading
  };
}
