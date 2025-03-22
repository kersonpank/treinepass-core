# Script PowerShell para testar o webhook do Asaas

# Configurações
$webhookUrl = "https://jlzkwcgzpfrdgcdjmjao.supabase.co/functions/v1/asaas-webhook"

# Ler o token do arquivo .env
$envContent = Get-Content -Path "../.env" -ErrorAction SilentlyContinue
$webhookToken = ($envContent | Where-Object { $_ -match "^ASAAS_WEBHOOK_TOKEN=(.*)$" } | ForEach-Object { $matches[1] })

Write-Host "Usando token: $webhookToken"

# Gerar IDs únicos
$eventId = "evt_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$paymentId = "pay_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$customerId = "cus_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$subscriptionId = "sub_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$today = Get-Date -Format "yyyy-MM-dd"
$dateCreated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$nextDueDate = (Get-Date).AddMonths(1).ToString("yyyy-MM-dd")

# Perguntar qual teste executar
Write-Host "Escolha o tipo de teste para executar:"
Write-Host "1. Pagamento confirmado"
Write-Host "2. Assinatura criada"
Write-Host "3. Pagamento recebido"
Write-Host "4. Teste sem event_id (para testar correção)"
$choice = Read-Host "Digite o número do teste (1-4)"

# Preparar payload baseado na escolha
if ($choice -eq "1") {
    $eventType = "PAYMENT_CONFIRMED"
    $payload = @{
        id = $eventId
        event = $eventType
        payment = @{
            id = $paymentId
            customer = $customerId
            value = 99.90
            netValue = 96.90
            billingType = "CREDIT_CARD"
            status = "CONFIRMED"
            dueDate = $today
            paymentDate = $today
            description = "Assinatura TreinePass"
            externalReference = "user_123456"
            invoiceUrl = "https://www.asaas.com/i/123456"
            invoiceNumber = "12345678"
        }
        dateCreated = $dateCreated
    }
} elseif ($choice -eq "2") {
    $eventType = "SUBSCRIPTION_CREATED"
    $payload = @{
        id = $eventId
        event = $eventType
        subscription = @{
            id = $subscriptionId
            customer = $customerId
            value = 99.90
            nextDueDate = $nextDueDate
            billingType = "CREDIT_CARD"
            status = "ACTIVE"
            description = "Assinatura TreinePass Mensal"
            externalReference = "user_123456"
            cycle = "MONTHLY"
        }
        dateCreated = $dateCreated
    }
} elseif ($choice -eq "3") {
    $eventType = "PAYMENT_RECEIVED"
    $payload = @{
        id = $eventId
        event = $eventType
        payment = @{
            id = $paymentId
            customer = $customerId
            value = 99.90
            netValue = 96.90
            billingType = "CREDIT_CARD"
            status = "RECEIVED"
            dueDate = $today
            paymentDate = $today
            description = "Assinatura TreinePass"
            externalReference = "user_123456"
            invoiceUrl = "https://www.asaas.com/i/123456"
            invoiceNumber = "12345678"
        }
        dateCreated = $dateCreated
    }
} elseif ($choice -eq "4") {
    $eventType = "PAYMENT_CONFIRMED (sem event_id)"
    $payload = @{
        event = "PAYMENT_CONFIRMED"
        payment = @{
            id = $paymentId
            customer = $customerId
            value = 99.90
            netValue = 96.90
            billingType = "CREDIT_CARD"
            status = "CONFIRMED"
            dueDate = $today
            paymentDate = $today
            description = "Assinatura TreinePass (sem event_id)"
            externalReference = "user_123456"
            invoiceUrl = "https://www.asaas.com/i/123456"
            invoiceNumber = "12345678"
        }
        dateCreated = $dateCreated
    }
} else {
    Write-Host "Opção inválida. Saindo."
    exit
}

# Converter para JSON
$jsonPayload = $payload | ConvertTo-Json -Depth 10

Write-Host "Enviando evento $eventType:"
Write-Host $jsonPayload

# Enviar a requisição
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = $webhookToken
    }
    
    # Adicionar o header asaas-webhook-token
    $headers.Add("asaas-webhook-token", $webhookToken)
    
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $jsonPayload -Headers $headers -ContentType "application/json"
    
    Write-Host "Resposta:"
    Write-Host ($response | ConvertTo-Json -Depth 5)
    Write-Host "Webhook enviado com sucesso!"
} catch {
    Write-Host "Erro ao enviar webhook: $_"
    Write-Host $_.Exception.Response.StatusCode
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody
    }
}

Write-Host "Teste concluído. Verifique o painel de administração para confirmar o processamento do evento."
