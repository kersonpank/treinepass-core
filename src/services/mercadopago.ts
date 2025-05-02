// Integração real Mercado Pago: criação de cliente e assinatura (preapproval)

// ATENÇÃO: Este arquivo só pode exportar funções seguras para o frontend!
// Funções que usam o ACCESS TOKEN do Mercado Pago NUNCA devem rodar no browser.
// Use apenas no backend (rotas /api ou funções server-side).

// Para o frontend, exporte apenas helpers seguros, como a public key:
export const MP_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

// Funções sensíveis (criação de customer/preapproval) devem ser feitas via API backend!
// Removido acesso direto ao ACCESS TOKEN do frontend.
