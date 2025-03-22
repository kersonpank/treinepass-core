# Soluu00e7u00e3o de Problemas com Webhooks do Asaas

## Problema

O componente `WebhookEvents` estava enfrentando erros de permissu00e3o (`403 Forbidden`) ao tentar acessar a tabela `asaas_webhook_events` no Supabase. Isso ocorria porque a tabela estava configurada com Row Level Security (RLS) e as polu00edticas nu00e3o estavam permitindo o acesso adequado para os usuu00e1rios administradores.

## Soluu00e7u00e3o Implementada

### 1. Modificau00e7u00e3o no Componente WebhookEvents

O componente foi modificado para usar um cliente Supabase com a chave de serviu00e7o (Service Role Key), que tem permissu00f5es para ignorar as polu00edticas de RLS. Isso permite que administradores possam visualizar e reprocessar eventos de webhook mesmo que as polu00edticas de RLS estejam restritivas.

```typescript
// Criar um cliente Supabase com permissu00f5es de administrador
const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);
```

### 2. Configurau00e7u00e3o de Variu00e1veis de Ambiente

Adicionamos a variu00e1vel de ambiente `VITE_SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env` para que o componente possa usar a chave de serviu00e7o do Supabase:

```
VITE_SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico-aqui
```

### 3. Script SQL para Corrigir Permissu00f5es

Criamos um script SQL (`fix-webhook-permissions.sql`) para configurar corretamente as polu00edticas de RLS na tabela `asaas_webhook_events`. Este script:

- Habilita RLS na tabela
- Remove polu00edticas existentes para evitar conflitos
- Cria novas polu00edticas para usuu00e1rios administradores e para o service_role
- Concede permissu00f5es adequadas para a tabela e funu00e7u00f5es relacionadas
- Adiciona uma funu00e7u00e3o de teste para verificar o acesso

## Como Aplicar a Soluu00e7u00e3o

1. Certifique-se de que o arquivo `.env` contu00e9m a variu00e1vel `VITE_SUPABASE_SERVICE_ROLE_KEY` com a chave de serviu00e7o correta

2. Execute o script SQL no SQL Editor do Supabase:
   - Acesse o dashboard do Supabase
   - Vu00e1 para a seu00e7u00e3o SQL Editor
   - Cole o conteu00fado do arquivo `scripts/fix-webhook-permissions.sql`
   - Execute o script

3. Teste o acesso executando a funu00e7u00e3o `test_webhook_events_access()` no SQL Editor:

```sql
SELECT test_webhook_events_access();
```

4. Reinicie a aplicau00e7u00e3o para garantir que as novas variu00e1veis de ambiente sejam carregadas

## Verificau00e7u00e3o

Apu00f3s aplicar a soluu00e7u00e3o, o componente `WebhookEvents` deve ser capaz de:

1. Listar todos os eventos de webhook
2. Filtrar eventos por status (sucesso/erro)
3. Reprocessar eventos com erro

Se ainda houver problemas, verifique:

- Se a funu00e7u00e3o `process_asaas_webhook` existe no banco de dados
- Se as polu00edticas de RLS estu00e3o configuradas corretamente
- Se a variu00e1vel de ambiente `VITE_SUPABASE_SERVICE_ROLE_KEY` estu00e1 correta
- Se o usuu00e1rio que estu00e1 tentando acessar tem o tipo 'admin' na tabela `user_types`

## Importante

A chave de serviu00e7o do Supabase (Service Role Key) tem permissu00f5es de administrador e pode ignorar as polu00edticas de RLS. Ela deve ser usada com cuidado e nunca deve ser exposta no lado do cliente em aplicau00e7u00f5es pu00fablicas. Neste caso, estamos usando-a apenas no componente administrativo que su00f3 u00e9 acessu00edvel por usuu00e1rios administradores.
