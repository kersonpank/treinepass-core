
/**
 * Tipos para configurações do sistema
 */

export interface AsaasSettings {
  environment: 'sandbox' | 'production';
  sandbox_api_key: string;
  production_api_key: string;
  webhook_token: string;
}
