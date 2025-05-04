
import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('[API] Creating MercadoPago preference:', req.body);
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('[API] MercadoPago access token not configured');
      return res.status(500).json({ message: 'MercadoPago access token not configured' });
    }

    const client = new MercadoPagoConfig({
      accessToken
    });

    const preference = new Preference(client);
    const preferenceData = req.body;

    // Validar dados mínimos necessários
    if (!preferenceData.items || preferenceData.items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    console.log('[API] Creating MercadoPago preference with data:', JSON.stringify(preferenceData, null, 2));

    // Criar preferência no MercadoPago
    const result = await preference.create({
      body: preferenceData,
    });
    
    console.log('[API] MercadoPago preference created:', {
      id: result.id,
      init_point: result.init_point?.substring(0, 50) + '...',
      sandbox_init_point: result.sandbox_init_point?.substring(0, 50) + '...',
    });

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('[API] Error creating MercadoPago preference:', error);
    return res.status(500).json({
      message: 'Failed to create payment preference',
      error: error.message || 'Unknown error'
    });
  }
}
