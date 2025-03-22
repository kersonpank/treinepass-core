# Script para verificar a integridade do sistema de webhooks

# Verificar se a função Edge está implantada
Write-Host "Verificando a função Edge asaas-webhook..."
Write-Host "Execute o comando abaixo no terminal do Supabase CLI:"
Write-Host "supabase functions list"
Write-Host "Certifique-se de que a função 'asaas-webhook' está listada e ativa."
Write-Host ""

# Verificar se o token do webhook está configurado
Write-Host "Verificando o token do webhook..."
$envContent = Get-Content -Path "../.env" -ErrorAction SilentlyContinue
$webhookToken = ($envContent | Where-Object { $_ -match "^ASAAS_WEBHOOK_TOKEN=(.*)$" } | ForEach-Object { $matches[1] })

if ([string]::IsNullOrEmpty($webhookToken)) {
    Write-Host "AVISO: Token do webhook não encontrado no arquivo .env" -ForegroundColor Yellow
    Write-Host "Certifique-se de que a variável ASAAS_WEBHOOK_TOKEN está configurada corretamente."
} else {
    Write-Host "Token do webhook encontrado: $webhookToken" -ForegroundColor Green
}
Write-Host ""

# Verificar se as funções SQL estão instaladas
Write-Host "Verificando as funções SQL..."
Write-Host "Execute os scripts SQL abaixo no SQL Editor do Supabase:"
Write-Host "1. Verificar a função process_asaas_webhook:"
Write-Host "SELECT pg_get_functiondef('public.process_asaas_webhook'::regproc);"
Write-Host ""
Write-Host "2. Verificar a função reprocess_failed_webhook_event:"
Write-Host "SELECT pg_get_functiondef('public.reprocess_failed_webhook_event'::regproc);"
Write-Host ""

# Verificar se a tabela de eventos existe
Write-Host "Verificando a tabela de eventos..."
Write-Host "Execute o script SQL abaixo no SQL Editor do Supabase:"
Write-Host "SELECT COUNT(*) FROM asaas_webhook_events;"
Write-Host ""

# Verificar logs recentes
Write-Host "Verificando logs recentes..."
Write-Host "Acesse o dashboard do Supabase e verifique os logs da função Edge asaas-webhook."
Write-Host "Procure por erros ou avisos nos logs."
Write-Host ""

# Testar o webhook
Write-Host "Testando o webhook..."
Write-Host "Execute o script test-webhook-simple.ps1 para enviar um webhook de teste:"
Write-Host "./test-webhook-simple.ps1"
Write-Host ""

# Verificar eventos recentes
Write-Host "Verificando eventos recentes..."
Write-Host "Execute o script check-webhook-events.sql no SQL Editor do Supabase para verificar os eventos recentes."
Write-Host ""

# Verificar status dos pagamentos
Write-Host "Verificando status dos pagamentos..."
Write-Host "Execute o script check-payment-status.sql no SQL Editor do Supabase para verificar o status dos pagamentos."
Write-Host ""

# Resumo
Write-Host "Resumo da verificação do sistema de webhooks:" -ForegroundColor Cyan
Write-Host "1. Verifique se a função Edge está implantada e ativa" -ForegroundColor Cyan
Write-Host "2. Verifique se o token do webhook está configurado corretamente" -ForegroundColor Cyan
Write-Host "3. Verifique se as funções SQL estão instaladas corretamente" -ForegroundColor Cyan
Write-Host "4. Verifique se a tabela de eventos existe e está funcionando" -ForegroundColor Cyan
Write-Host "5. Verifique os logs recentes da função Edge" -ForegroundColor Cyan
Write-Host "6. Teste o webhook com o script test-webhook-simple.ps1" -ForegroundColor Cyan
Write-Host "7. Verifique os eventos recentes com o script check-webhook-events.sql" -ForegroundColor Cyan
Write-Host "8. Verifique o status dos pagamentos com o script check-payment-status.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se todos os itens acima estiverem corretos, o sistema de webhooks deve estar funcionando corretamente." -ForegroundColor Green
