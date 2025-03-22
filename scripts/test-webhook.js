/**
 * Script para testar o webhook do Asaas
 * 
 * Este script simula eventos do Asaas e envia para o endpoint do webhook
 * para testar o processamento de diferentes tipos de eventos.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Configurações
const WEBHOOK_URL = 'https://jlzkwcgzpfrdgcdjmjao.supabase.co/functions/v1/asaas-webhook'; // URL local do webhook
const WEBHOOK_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsemt3Y2d6cGZyZGdjZGptamFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzY5ODYsImV4cCI6MjA1MjU1Mjk4Nn0.jWqRJdpYYqrWAiFqXhSpA_Ry7rWPVmI4EGG-HBRlETw'; // Token configurado no webhook

// Tipos de eventos para testar
const EVENT_TYPES = {
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  PAYMENT_DELETED: 'PAYMENT_DELETED',
  PAYMENT_UPDATED: 'PAYMENT_UPDATED',
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_RECEIVED_IN_CASH_UNDONE: 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  PAYMENT_CHARGEBACK_REQUESTED: 'PAYMENT_CHARGEBACK_REQUESTED',
  PAYMENT_CHARGEBACK_DISPUTE: 'PAYMENT_CHARGEBACK_DISPUTE',
  PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  PAYMENT_DUNNING_RECEIVED: 'PAYMENT_DUNNING_RECEIVED',
  PAYMENT_DUNNING_REQUESTED: 'PAYMENT_DUNNING_REQUESTED',
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED: 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_DELETED: 'SUBSCRIPTION_DELETED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_ENDED: 'SUBSCRIPTION_ENDED',
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED'
};

// Função para gerar um ID aleatório
function generateId(prefix = '') {
  return `${prefix}${crypto.randomBytes(8).toString('hex')}`;
}

// Função para gerar um payload de pagamento
function generatePaymentPayload(eventType) {
  const paymentId = generateId('pay_');
  const customerId = generateId('cus_');
  const subscriptionId = generateId('sub_');
  
  return {
    event: eventType,
    payment: {
      id: paymentId,
      customer: customerId,
      subscription: eventType.includes('SUBSCRIPTION') ? subscriptionId : null,
      value: 99.90,
      netValue: 96.90,
      billingType: 'CREDIT_CARD',
      status: eventType === EVENT_TYPES.PAYMENT_CONFIRMED ? 'CONFIRMED' : 
              eventType === EVENT_TYPES.PAYMENT_RECEIVED ? 'RECEIVED' : 
              eventType === EVENT_TYPES.PAYMENT_OVERDUE ? 'OVERDUE' : 'PENDING',
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: eventType.includes('RECEIVED') || eventType.includes('CONFIRMED') ? 
                   new Date().toISOString().split('T')[0] : null,
      description: 'Assinatura TreinePass',
      externalReference: `user_123456`,
      invoiceUrl: `https://www.asaas.com/i/${paymentId}`,
      invoiceNumber: '12345678',
      creditCard: {
        creditCardNumber: '************1234',
        creditCardBrand: 'VISA',
        creditCardToken: generateId('token_')
      }
    },
    subscription: eventType.includes('SUBSCRIPTION') ? {
      id: subscriptionId,
      customer: customerId,
      value: 99.90,
      nextDueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      status: eventType === EVENT_TYPES.SUBSCRIPTION_ENDED ? 'INACTIVE' : 'ACTIVE',
      billingType: 'CREDIT_CARD',
      description: 'Assinatura TreinePass',
      externalReference: `user_123456`,
      cycle: 'MONTHLY'
    } : null,
    customer: eventType.includes('CUSTOMER') ? {
      id: customerId,
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: '11999999999',
      mobilePhone: '11999999999',
      cpfCnpj: '12345678909',
      postalCode: '01234567',
      address: 'Rua Teste',
      addressNumber: '123',
      complement: 'Apto 123',
      province: 'Bairro Teste',
      externalReference: 'user_123456',
      notificationDisabled: false,
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    } : null
  };
}

// Função para enviar o webhook
async function sendWebhook(eventType) {
  const payload = generatePaymentPayload(eventType);
  
  console.log(`Enviando evento ${eventType}...`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    console.log(`Resposta (${response.status}): ${responseText}`);
    return { success: response.ok, status: response.status, response: responseText };
  } catch (error) {
    console.error(`Erro ao enviar webhook ${eventType}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Função principal para testar todos os eventos ou um evento específico
async function testWebhooks(specificEvent = null) {
  const results = [];
  const eventsToTest = specificEvent ? [specificEvent] : Object.values(EVENT_TYPES);
  
  for (const eventType of eventsToTest) {
    const result = await sendWebhook(eventType);
    results.push({ eventType, ...result });
    // Pequeno delay entre as requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nResultados dos testes:');
  results.forEach(result => {
    console.log(`${result.eventType}: ${result.success ? 'SUCESSO' : 'FALHA'} (${result.status || 'N/A'})`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nResumo: ${successCount}/${results.length} eventos processados com sucesso.`);
}

// Verificar argumentos da linha de comando
const eventArg = process.argv[2];
if (eventArg && !Object.values(EVENT_TYPES).includes(eventArg)) {
  console.error(`Evento inválido: ${eventArg}`);
  console.log('Eventos disponíveis:', Object.values(EVENT_TYPES).join(', '));
  process.exit(1);
}

// Executar os testes
console.log('Iniciando testes de webhook do Asaas...');
console.log(`URL do webhook: ${WEBHOOK_URL}\n`);

testWebhooks(eventArg);
