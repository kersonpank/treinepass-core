# Documentau00e7u00e3o do Sistema de Webhooks do TreinePass

## Visão Geral

O TreinePass utiliza webhooks do Asaas para processar eventos relacionados a pagamentos, assinaturas e clientes. Esta documentação descreve como o sistema de webhooks funciona, as melhorias implementadas e como testar e monitorar os eventos.

## Estrutura do Sistema

### Endpoint do Webhook

O endpoint do webhook está localizado em:

```
/supabase/functions/asaas-webhook/index.ts
```

Este endpoint recebe eventos do Asaas, valida o token de autenticação e registra os eventos no banco de dados para processamento.

### Função de Processamento

A função SQL que processa os eventos está em:

```
/supabase/migrations/20240326000009_create_process_webhook_function.sql
```

Esta função é responsável por processar diferentes tipos de eventos e atualizar o banco de dados de acordo.

### Tabela de Eventos

Os eventos são armazenados na tabela `asaas_webhook_events` com os seguintes campos:

- `id`: Identificador único do evento
- `event_type`: Tipo do evento (ex: PAYMENT_RECEIVED, SUBSCRIPTION_CREATED)
- `event_data`: Dados completos do evento em formato JSON
- `processed`: Flag indicando se o evento foi processado com sucesso
- `processed_at`: Data e hora do processamento
- `created_at`: Data e hora de recebimento do evento
- `error_message`: Mensagem de erro, se houver
- `retry_count`: Número de tentativas de processamento

## Tipos de Eventos Suportados

### Eventos de Pagamento

- `PAYMENT_RECEIVED`: Pagamento recebido
- `PAYMENT_CONFIRMED`: Pagamento confirmado
- `PAYMENT_OVERDUE`: Pagamento atrasado
- `PAYMENT_DELETED`: Pagamento excluído
- `PAYMENT_UPDATED`: Pagamento atualizado
- `PAYMENT_CREATED`: Pagamento criado
- `PAYMENT_REFUNDED`: Pagamento reembolsado
- `PAYMENT_RECEIVED_IN_CASH_UNDONE`: Pagamento em dinheiro desfeito
- `PAYMENT_CHARGEBACK_REQUESTED`: Chargeback solicitado
- `PAYMENT_CHARGEBACK_DISPUTE`: Disputa de chargeback
- `PAYMENT_AWAITING_CHARGEBACK_REVERSAL`: Aguardando reversão de chargeback
- `PAYMENT_DUNNING_RECEIVED`: Dunning recebido
- `PAYMENT_DUNNING_REQUESTED`: Dunning solicitado

### Eventos de Assinatura

- `SUBSCRIPTION_CREATED`: Assinatura criada
- `SUBSCRIPTION_UPDATED`: Assinatura atualizada
- `SUBSCRIPTION_DELETED`: Assinatura excluída
- `SUBSCRIPTION_RENEWED`: Assinatura renovada
- `SUBSCRIPTION_ENDED`: Assinatura encerrada

### Eventos de Cliente

- `CUSTOMER_CREATED`: Cliente criado
- `CUSTOMER_UPDATED`: Cliente atualizado
- `CUSTOMER_DELETED`: Cliente excluído

## Melhorias Implementadas

1. **Validação de Token Robusta**:
   - Verificação segura do token de autenticação para evitar requisições não autorizadas

2. **Tratamento de Erros Aprimorado**:
   - Registro detalhado de erros durante o processamento
   - Mecanismo de retry para eventos que falham no processamento

3. **Suporte a Mais Tipos de Eventos**:
   - Adição de suporte para eventos de cliente e assinatura
   - Tratamento específico para diferentes status de pagamento

4. **Logging Detalhado**:
   - Registro de todos os eventos recebidos
   - Informações detalhadas sobre o processamento e erros

5. **Interface de Administração**:
   - Painel para monitorar eventos de webhook
   - Funcionalidade para reprocessar eventos com erro

6. **Índices de Banco de Dados**:
   - Índices para melhorar a performance de consultas
   - View para facilitar a análise de eventos com erro

## Como Testar

### Script de Teste

Um script de teste está disponível em `/scripts/test-webhook.js`. Este script simula eventos do Asaas e envia para o endpoint do webhook.

#### Pré-requisitos

- Node.js instalado
- Dependências: `node-fetch` e `crypto`

#### Instalação

```bash
npm install node-fetch crypto
```

#### Uso

Para testar todos os tipos de eventos:

```bash
node scripts/test-webhook.js
```

Para testar um tipo específico de evento:

```bash
node scripts/test-webhook.js PAYMENT_RECEIVED
```

### Configuração Local

Para testar localmente, você precisa:

1. Iniciar o servidor Supabase local:

```bash
npx supabase start
```

2. Atualizar o `WEBHOOK_URL` e `WEBHOOK_TOKEN` no script de teste

3. Executar o script de teste

### Monitoramento

Você pode monitorar os eventos de webhook através do painel administrativo em:

```
/admin-dashboard -> aba Webhooks
```

Este painel permite:

- Visualizar todos os eventos recebidos
- Filtrar eventos por status (sucesso/erro)
- Reprocessar eventos que falharam
- Ver detalhes dos erros

## Solução de Problemas

### Eventos Não Processados

Se um evento não for processado corretamente:

1. Verifique a mensagem de erro no painel administrativo
2. Verifique os logs do Supabase para mais detalhes
3. Tente reprocessar o evento pelo painel administrativo

### Erros Comuns

- **Token Inválido**: Verifique se o token configurado no webhook corresponde ao token esperado pelo Asaas
- **Erro de Processamento**: Verifique se o formato do payload corresponde ao esperado pela função de processamento
- **Erro de Banco de Dados**: Verifique se as tabelas e relacionamentos estão configurados corretamente

## Boas Práticas

1. **Monitoramento Regular**: Verifique regularmente o painel de webhooks para identificar eventos não processados
2. **Testes Após Atualizações**: Após atualizar o sistema, teste novamente os webhooks para garantir que tudo continua funcionando
3. **Backup de Eventos**: Considere implementar um backup dos eventos para casos de falha no processamento
4. **Alertas**: Configure alertas para eventos que falham no processamento

## Próximos Passos

1. **Implementar Filas**: Adicionar um sistema de filas para processamento assíncrono de eventos
2. **Melhorar Retry Logic**: Implementar backoff exponencial para retentativas
3. **Expandir Monitoramento**: Adicionar métricas e dashboards para monitoramento em tempo real
4. **Testes Automatizados**: Criar testes automatizados para validar o processamento de webhooks
