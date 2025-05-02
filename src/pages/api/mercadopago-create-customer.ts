import type { NextApiRequest, NextApiResponse } from 'next';

// Função real de criação de cliente Mercado Pago
const MP_BASE_URL = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN = process.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '';

async function createMercadoPagoCustomer({ name, email, cpf, phone }: { name: string; email: string; cpf: string; phone: string; }) {
  try {
    const response = await fetch(`${MP_BASE_URL}/v1/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        email,
        first_name: name,
        identification: {
          type: 'CPF',
          number: cpf,
        },
        phone: {
          area_code: phone.slice(0, 2),
          number: phone.slice(2),
        },
      }),
    });
    const data = await response.json();
    if (response.ok && data.id) {
      return { success: true, customer: { id: data.id } };
    }
    return { success: false, error: data };
  } catch (error) {
    return { success: false, error };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, cpf, phone } = req.body;
  if (!name || !email || !cpf || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Verificação extra: CPF deve ser só números e válido (simples)
  if (!/^\d{11}$/.test(cpf)) {
    return res.status(400).json({ message: 'CPF inválido. Deve conter 11 dígitos numéricos.' });
  }

  // Verificação extra: email
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: 'E-mail inválido.' });
  }

  // Verificação extra: telefone
  if (!/^\d{10,11}$/.test(phone)) {
    return res.status(400).json({ message: 'Telefone inválido. Deve conter 10 ou 11 dígitos numéricos.' });
  }

  // Aqui pode-se consultar o Supabase para garantir unicidade, se necessário
  // (opcional, pois já há validação no fluxo principal)

  const result = await createMercadoPagoCustomer({ name, email, cpf, phone });
  if (result.success) {
    return res.status(200).json({ customer: result.customer });
  }
  return res.status(500).json({ error: result.error });
}
