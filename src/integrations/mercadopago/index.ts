import { MercadoPagoConfig, Preference } from 'mercadopago';
import { UserProfile } from '@/types/user';

export interface MercadoPagoPaymentRequest {
  items: {
    title: string;
    unit_price: number;
    quantity: number;
  }[];
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: 'CPF' | 'CNPJ';
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
  back_urls?: {
    success: string;
    pending: string;
    failure: string;
  };
}

export interface MercadoPagoPaymentResponse {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '',
});

export async function createMercadoPagoPayment(
  request: MercadoPagoPaymentRequest
): Promise<MercadoPagoPaymentResponse> {
  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: request,
    });
    
    return {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    };
  } catch (error) {
    console.error('Error creating Mercado Pago payment:', error);
    throw error;
  }
}

export function mapUserToPayer(user: UserProfile) {
  return {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    ...(user.cpf && { identification: {
      type: 'CPF',
      number: user.cpf.replace(/[^0-9]/g, ''),
    }}),
  };
}
