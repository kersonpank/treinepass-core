import type { NextApiRequest, NextApiResponse } from 'next';
import { createMercadoPagoPreapproval } from '@/services/mercadopago';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { planName, planValue, payerEmail, backUrl } = req.body;
  if (!planName || !planValue || !payerEmail || !backUrl) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const auto_recurring = {
    frequency: 1,
    frequency_type: 'months',
    transaction_amount: planValue,
    currency_id: 'BRL',
  };

  const result = await createMercadoPagoPreapproval({
    reason: planName,
    auto_recurring,
    back_url: backUrl,
    payer_email: payerEmail,
  });

  if (result.success) {
    return res.status(200).json({ preapproval: result.preapproval });
  }
  return res.status(500).json({ error: result.error });
}
