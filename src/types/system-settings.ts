
export interface AsaasSettings {
  sandbox_api_key: string;
  production_api_key: string;
  webhook_token: string;
  environment: 'sandbox' | 'production';
}

export interface SystemSettings {
  asaas_settings: AsaasSettings;
}

export type SystemSettingsKey = keyof SystemSettings; 
