// Script simples para testar o webhook do Asaas
const https = require('https');
const fs = require('fs');
const path = require('path');

// Ler o token do arquivo .env
function getEnvValue(key) {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.startsWith(key + '=')) {
        return line.substring(key.length + 1).trim();
      }
    }
    return null;
  } catch (error) {
    console.error('Erro ao ler arquivo .env:', error.message);
    return null;
  }
}

// Configurau00e7u00f5es
const WEBHOOK_URL = 'https://jlzkwcgzpfrdgcdjmjao.supabase.co/functions/v1/asaas-webhook';
const WEBHOOK_TOKEN = getEnvValue('ASAAS_WEBHOOK_TOKEN') || 'seu_token_do_webhook';

console.log('Usando token:', WEBHOOK_TOKEN);

// Payload de teste - evento de pagamento confirmado
const testPayload = {
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: 'pay_' + Math.random().toString(36).substring(2, 15),
    customer: 'cus_' + Math.random().toString(36).substring(2, 15),
    value: 99.90,
    netValue: 96.90,
    billingType: 'CREDIT_CARD',
    status: 'CONFIRMED',
    dueDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    description: 'Assinatura TreinePass',
    externalReference: 'user_123456',
    invoiceUrl: 'https://www.asaas.com/i/123456',
    invoiceNumber: '12345678'
  }
};

// Converter o payload para JSON
const data = JSON.stringify(testPayload);

// Configurar a requisiu00e7u00e3o
const options = {
  hostname: 'jlzkwcgzpfrdgcdjmjao.supabase.co',
  path: '/functions/v1/asaas-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': WEBHOOK_TOKEN
  }
};

// Enviar a requisiu00e7u00e3o
const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Resposta: ${chunk}`);
  });
});

req.on('error', (error) => {
  console.error(`Erro: ${error.message}`);
});

// Enviar o payload
req.write(data);
req.end();

console.log('Webhook de teste enviado!');
console.log('Payload:', testPayload);
