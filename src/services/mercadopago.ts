
// Mercado Pago integration service
import { UserProfile } from '@/types/user';

// Constants
export const MP_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';
export const MP_ACCESS_TOKEN = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '';
export const IS_SANDBOX = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX === 'true';
export const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:8080';

// Types
export interface MercadoPagoItem {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  currency_id?: string;
  unit_price: number;
}

export interface MercadoPagoPayer {
  email: string;
  name?: string;
  surname?: string;
  identification?: {
    type: string;
    number: string;
  };
  phone?: {
    area_code?: string;
    number?: string;
  };
  address?: {
    zip_code?: string;
    street_name?: string;
    street_number?: number;
  };
}

export interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  payment_methods?: {
    excluded_payment_methods?: { id: string }[];
    excluded_payment_types?: { id: string }[];
    installments?: number;
  };
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  notification_url?: string;
  statement_descriptor?: string;
  external_reference?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

// Helper function to map user profile to MP payer
export function mapUserToMercadoPagoPayer(user: UserProfile): MercadoPagoPayer {
  return {
    email: user.email || '',
    name: user.full_name ? user.full_name.split(' ')[0] : '',
    surname: user.full_name ? user.full_name.split(' ').slice(1).join(' ') : '',
    ...(user.cpf && {
      identification: {
        type: 'CPF',
        number: user.cpf.replace(/\D/g, '')
      }
    }),
    ...(user.phone_number && {
      phone: {
        number: user.phone_number.replace(/\D/g, '')
      }
    })
  };
}

// Function to create payment preference
export async function createPaymentPreference(preference: MercadoPagoPreference): Promise<MercadoPagoPreferenceResponse> {
  try {
    // In a real implementation, this should call a backend API
    // We should never expose the access token in frontend code
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creating payment preference');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    throw error;
  }
}

// Function to get the correct init point based on environment
export function getInitPoint(preferenceResponse: MercadoPagoPreferenceResponse): string {
  return IS_SANDBOX ? preferenceResponse.sandbox_init_point : preferenceResponse.init_point;
}

// Function to initialize MercadoPago SDK
export function initMercadoPagoSDK(): void {
  if (typeof window !== 'undefined' && MP_PUBLIC_KEY) {
    // Check if SDK script already exists
    if (!document.getElementById('mercadopago-script')) {
      const script = document.createElement('script');
      script.id = 'mercadopago-script';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      document.body.appendChild(script);
      
      // Initialize once loaded
      script.onload = () => {
        if ((window as any).MercadoPago) {
          new (window as any).MercadoPago(MP_PUBLIC_KEY);
          console.log('MercadoPago SDK initialized');
        }
      };
    }
  }
}

// Function to create a payment brick
export function createPaymentBrick(
  containerId: string,
  options: {
    amount: number;
    callbackSuccess: (data: any) => void;
    callbackError: (error: any) => void;
    metadata?: Record<string, any>;
  }
): void {
  if (typeof window === 'undefined' || !MP_PUBLIC_KEY) return;
  
  const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
  const brickBuilder = mp.bricks();
  
  brickBuilder.create('payment', containerId, {
    initialization: {
      amount: options.amount,
    },
    customization: {
      visual: {
        hideFormTitle: true,
        hidePaymentButton: false,
      },
    },
    callbacks: {
      onReady: () => {
        console.log('Payment Brick is ready');
      },
      onSubmit: async (formData: any) => {
        try {
          // Add metadata
          const paymentData = {
            ...formData,
            metadata: options.metadata || {},
          };
          
          // Call backend to process payment
          const response = await fetch('/api/mercadopago/process-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Payment failed');
          }
          
          const responseData = await response.json();
          options.callbackSuccess(responseData);
          return true;
        } catch (error) {
          console.error('Payment error:', error);
          options.callbackError(error);
          return false;
        }
      },
      onError: (error: any) => {
        console.error('Brick error:', error);
        options.callbackError(error);
      },
    },
  });
}
