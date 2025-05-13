
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('[API] Creating MercadoPago preference:', req.body);
    
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('[API] MercadoPago access token not configured');
      return res.status(500).json({ message: 'MercadoPago access token not configured' });
    }

    // Create MercadoPago preference
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API] MercadoPago preference creation failed:', errorData);
      return res.status(response.status).json({ 
        message: 'Failed to create preference', 
        error: errorData
      });
    }

    const data = await response.json();
    console.log('[API] MercadoPago preference created:', {
      id: data.id,
      init_point: data.init_point?.substring(0, 50) + '...',
    });

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
    
  } catch (error: any) {
    console.error('[API] Error creating MercadoPago preference:', error);
    return res.status(500).json({
      message: 'Failed to create payment preference',
      error: error.message || 'Unknown error'
    });
  }
}
