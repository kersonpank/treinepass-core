
import { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ 
        message: 'MercadoPago access token not configured'
      });
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken
    });

    // Create a new preference
    const preference = new Preference(client);
    
    const preferenceData = {
      ...req.body,
      statement_descriptor: 'TreinePass',
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    };
    
    console.log('Creating preference with data:', JSON.stringify(preferenceData, null, 2));
    
    // Process the request data
    const result = await preference.create({
      body: preferenceData
    });

    // Return successful response
    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Error creating preference:', error);
    return res.status(500).json({ 
      message: 'Failed to create payment preference',
      error: error.message || 'Unknown error'
    });
  }
}
