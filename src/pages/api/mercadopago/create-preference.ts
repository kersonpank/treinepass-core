
import { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[API] create-preference - Iniciando com método:', req.method);
  
  // Only allow POST method
  if (req.method !== 'POST') {
    console.log('[API] create-preference - Método não permitido:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('[API] create-preference - Token de acesso não configurado');
      return res.status(500).json({ 
        message: 'MercadoPago access token not configured',
        env: {
          hasToken: !!process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN,
          hasViteToken: !!import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN,
        }
      });
    }

    console.log('[API] create-preference - Usando token:', accessToken.substring(0, 10) + '...');
    console.log('[API] create-preference - Dados da requisição:', JSON.stringify(req.body, null, 2));

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
    
    console.log('[API] create-preference - Criando preferência com dados:', JSON.stringify(preferenceData, null, 2));
    
    // Process the request data
    const result = await preference.create({
      body: preferenceData
    });

    console.log('[API] create-preference - Preferência criada com sucesso:', {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

    // Return successful response
    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('[API] create-preference - Erro ao criar preferência:', error);
    
    // Log detalhes adicionais do erro se disponível
    if (error.response) {
      console.error('[API] create-preference - Detalhes da resposta de erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to create payment preference',
      error: error.message || 'Unknown error',
      stack: error.stack,
      details: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
}
