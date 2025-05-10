
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get Mercado Pago config from system settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'payment_gateways')
      .single();

    if (error) {
      console.error('Error fetching Mercado Pago settings:', error);
      return res.status(500).json({ message: 'Error fetching payment settings' });
    }

    // Extract public key based on environment
    let publicKey = '';
    
    if (data?.value) {
      const settings = data.value;
      let parsedSettings;
      
      if (typeof settings === 'string') {
        try {
          parsedSettings = JSON.parse(settings);
        } catch (e) {
          console.error('Error parsing settings:', e);
          parsedSettings = {};
        }
      } else {
        parsedSettings = settings;
      }
      
      const environment = parsedSettings?.mercadopago?.environment || 'sandbox';
      
      // Use environment-specific key
      if (environment === 'production') {
        publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';
      } else {
        publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY || '';
      }
      
      // If no specific keys are set, use the general public key
      if (!publicKey) {
        publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';
      }
    }

    // Return the public key
    return res.status(200).json({
      publicKey
    });
    
  } catch (error: any) {
    console.error('Error initializing Mercado Pago:', error);
    return res.status(500).json({
      message: 'Error initializing Mercado Pago',
      error: error.message
    });
  }
}
