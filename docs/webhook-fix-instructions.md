# Instruções para Corrigir e Monitorar o Sistema de Webhooks do Asaas

Este documento contém instruções para corrigir e monitorar o sistema de webhooks do Asaas no TreinePass.

## Problema Identificado

O sistema de webhooks está apresentando os seguintes problemas:

1. A função `process_asaas_webhook` não está lidando com o evento `PAYMENT_CONFIRMED`
2. A função não tem um caso padrão para lidar com eventos desconhecidos
3. A coluna `event_id` na tabela `asaas_webhook_events` é obrigatória (NOT NULL), mas o webhook de teste não está incluindo esse campo

## Solução

Siga os passos abaixo para corrigir o problema:

### 1. Execute o Script SQL para Corrigir a Função

1. Acesse o dashboard do Supabase
2. Vá para a seção SQL Editor
3. Cole o conteúdo do arquivo `scripts/fix-webhook-function.sql`
4. Execute o script

Este script faz as seguintes alterações:

- Modifica a função `process_asaas_webhook` para gerar um ID de evento quando não estiver presente no payload
- Adiciona um caso para lidar com o evento `PAYMENT_CONFIRMED`
- Adiciona um caso padrão para lidar com eventos desconhecidos

### 2. Corrija a Função de Reprocessamento

1. Execute o script `scripts/fix-reprocess-function.sql` para remover a função existente e criar uma nova versão
2. Este script corrige o erro `cannot change name of input parameter "event_id"`

### 3. Teste o Webhook

1. Execute o script `scripts/test-webhook-simple.ps1` para enviar um webhook de teste
   - Este script gera um tipo de evento aleatório e envia para o endpoint do webhook
   - O payload e a resposta são salvos em arquivos para inspeção
2. Verifique se o evento foi registrado na tabela `asaas_webhook_events` usando o script `scripts/check-webhook-events.sql`

### 4. Reprocesse Eventos com Erro

1. Use o script `scripts/test-reprocess-webhook.sql` para identificar eventos não processados
2. Descomente a linha apropriada para reprocessar um evento específico ou todos os eventos não processados

## Ferramentas Adicionais

### 1. Teste com Pagamento Real

Para testar o webhook com um pagamento real do seu sistema:

1. Execute o script `scripts/test-real-payment.ps1`
2. Digite o ID do pagamento real quando solicitado
3. Verifique se o pagamento foi atualizado corretamente no sistema

### 2. Teste de Sequência de Eventos

Para testar uma sequência completa de eventos (criação de assinatura, criação de pagamento, recebimento e confirmação):

1. Execute o script `scripts/test-webhook-sequence.ps1`
2. Este script envia uma sequência de eventos relacionados à mesma assinatura e pagamento
3. Verifique se todos os eventos foram processados corretamente

### 3. Monitoramento de Eventos

Para monitorar os eventos de webhook:

1. Execute o script `scripts/monitor-webhook-events.sql`
2. Este script fornece estatísticas sobre os eventos de webhook, incluindo:
   - Resumo de eventos por tipo
   - Eventos com erro
   - Eventos mais recentes
   - Tempo médio de processamento

### 4. Verificação de Status de Pagamentos

Para verificar o status dos pagamentos no sistema:

1. Execute o script `scripts/check-payment-status.sql`
2. Este script mostra:
   - Os últimos pagamentos processados
   - Pagamentos que foram atualizados por webhooks
   - Histórico de assinaturas

## Estrutura do Sistema de Webhooks

O sistema de webhooks do Asaas funciona da seguinte forma:

1. O Asaas envia um webhook para a função Edge do Supabase (`asaas-webhook`)
2. A função Edge salva o evento na tabela `asaas_webhook_events`
3. A função Edge chama a função `process_asaas_webhook` para processar o evento
4. A função `process_asaas_webhook` atualiza o status do pagamento no sistema
5. Se um evento não for processado corretamente, ele pode ser reprocessado usando a função `reprocess_failed_webhook_event`

## Formato do Payload do Webhook

O payload do webhook do Asaas tem o seguinte formato:

```json
{
  "id": "evt_05b708f961d739ea7eba7e4db318f621&8705083",
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_r14cyfebtjf8au8x",
    "customer": "cus_000006543659",
    "value": 99.90,
    "netValue": 96.90,
    "billingType": "CREDIT_CARD",
    "status": "CONFIRMED",
    "dueDate": "2025-04-21",
    "paymentDate": "2025-04-21",
    "description": "Assinatura TreinePass",
    "externalReference": "user_123456",
    "invoiceUrl": "https://sandbox.asaas.com/i/r14cyfebtjf8au8x",
    "invoiceNumber": "07953917"
  },
  "dateCreated": "2025-03-14 21:05:10"
}
```

## Tipos de Eventos do Asaas

Os principais tipos de eventos do Asaas são:

- `PAYMENT_CREATED`: Um pagamento foi criado
- `PAYMENT_RECEIVED`: Um pagamento foi recebido
- `PAYMENT_CONFIRMED`: Um pagamento foi confirmado
- `PAYMENT_OVERDUE`: Um pagamento está atrasado
- `PAYMENT_REFUNDED`: Um pagamento foi reembolsado
- `PAYMENT_DELETED`: Um pagamento foi excluído
- `SUBSCRIPTION_CREATED`: Uma assinatura foi criada
- `SUBSCRIPTION_UPDATED`: Uma assinatura foi atualizada
- `SUBSCRIPTION_DELETED`: Uma assinatura foi excluída
- `SUBSCRIPTION_RENEWED`: Uma assinatura foi renovada
- `SUBSCRIPTION_ENDED`: Uma assinatura foi encerrada

## Troubleshooting

Se você continuar tendo problemas com o webhook, verifique:

1. Se o token do webhook está configurado corretamente no Asaas e no Supabase
2. Se a função Edge `asaas-webhook` está funcionando corretamente
3. Se a tabela `asaas_webhook_events` tem as permissões corretas
4. Se a função `process_asaas_webhook` está processando corretamente os eventos

### Problemas Comuns e Soluções

1. **Evento não processado**: Use a função `reprocess_failed_webhook_event` para reprocessar o evento
2. **Token inválido**: Verifique se o token está configurado corretamente no arquivo `.env` e no Asaas
3. **Pagamento não encontrado**: Verifique se o ID do pagamento existe no seu sistema
4. **Erro no processamento**: Verifique a mensagem de erro na tabela `asaas_webhook_events`

## Logs e Monitoramento

Para monitorar os webhooks, você pode:

1. Verificar os logs da função Edge no Supabase
2. Verificar os eventos na tabela `asaas_webhook_events` usando o script `scripts/check-webhook-events.sql`
3. Reprocessar eventos com erro usando a função `reprocess_failed_webhook_event`
4. Usar o script `scripts/monitor-webhook-events.sql` para obter estatísticas sobre os eventos

## Manutenção

Para manter o sistema de webhooks funcionando corretamente:

1. **Monitore regularmente**: Execute o script `scripts/monitor-webhook-events.sql` para verificar se há eventos com erro
2. **Reprocesse eventos com erro**: Use o script `scripts/test-reprocess-webhook.sql` para reprocessar eventos com erro
3. **Teste novos tipos de eventos**: Quando o Asaas adicionar novos tipos de eventos, atualize a função `process_asaas_webhook` para lidar com eles
4. **Verifique o status dos pagamentos**: Use o script `scripts/check-payment-status.sql` para verificar se os pagamentos estão sendo atualizados corretamente
