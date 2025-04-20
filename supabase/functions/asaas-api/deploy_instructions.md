# Instruções para Deploy da Edge Function Asaas-API

## Correções Implementadas

1. Adicionamos verificações para valores undefined em todos os lugares onde usamos .replace()
2. Melhoramos o mapeamento de dados do cliente para o formato esperado pelo Asaas
3. Implementamos o cancelamento automático de assinaturas pendentes
4. Garantimos que o callback está sendo passado corretamente

## Como fazer o deploy

1. Acesse o painel do Supabase (https://supabase.com/dashboard)
2. Selecione seu projeto (jlzkwcgzpfrdgcdjmjao)
3. Navegue até "Edge Functions"
4. Selecione a função "asaas-api"
5. Faça upload do arquivo actions.ts atualizado

## Testes após o deploy

1. Teste o checkout com cartão de crédito
2. Verifique se o checkout do Asaas está sendo exibido corretamente
3. Confirme que as URLs de callback estão funcionando

Lembre-se que as correções implementadas seguem as memórias sobre:
- Uso do CPF real do usuário quando disponível
- Cancelamento automático de assinaturas pendentes
- Fluxo de pagamentos recorrentes com Asaas
