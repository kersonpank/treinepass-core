# Script PowerShell simplificado para testar o webhook do Asaas

# Configurau00e7u00f5es
$webhookUrl = "https://jlzkwcgzpfrdgcdjmjao.supabase.co/functions/v1/asaas-webhook"

# Ler o token do arquivo .env
$envContent = Get-Content -Path "../.env" -ErrorAction SilentlyContinue
$webhookToken = ($envContent | Where-Object { $_ -match "^ASAAS_WEBHOOK_TOKEN=(.*)$" } | ForEach-Object { $matches[1] })

Write-Host "Usando token: $webhookToken"

# Gerar IDs u00fanicos
$eventId = "evt_" + [Guid]::NewGuid().ToString().Substring(0, 8) + "&" + (Get-Random -Minimum 1000000 -Maximum 9999999)
$paymentId = "pay_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$customerId = "cus_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$subscriptionId = "sub_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$today = Get-Date -Format "yyyy-MM-dd"
$dateCreated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Selecionar o tipo de evento
$eventTypes = @(
    "PAYMENT_CREATED",
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "PAYMENT_DELETED",
    "SUBSCRIPTION_CREATED"
)

# Escolher um tipo de evento aleatoriamente
$eventType = $eventTypes[(Get-Random -Minimum 0 -Maximum $eventTypes.Length)]

# Payload de teste com base no tipo de evento
if ($eventType -like "PAYMENT*") {
    $payload = @{
        id = $eventId
        event = $eventType
        payment = @{
            id = $paymentId
            customer = $customerId
            value = 99.90
            netValue = 96.90
            billingType = "CREDIT_CARD"
            status = $eventType.Replace("PAYMENT_", "")
            dueDate = $today
            paymentDate = $today
            description = "Assinatura TreinePass"
            externalReference = "user_123456"
            invoiceUrl = "https://www.asaas.com/i/123456"
            invoiceNumber = "12345678"
            subscription = $subscriptionId
        }
        dateCreated = $dateCreated
    }
} else {
    $payload = @{
        id = $eventId
        event = $eventType
        subscription = @{
            id = $subscriptionId
            customer = $customerId
            value = 99.90
            nextDueDate = $today
            description = "Assinatura TreinePass"
            externalReference = "user_123456"
            status = "ACTIVE"
        }
        dateCreated = $dateCreated
    }
}

$payloadJson = ConvertTo-Json -InputObject $payload -Depth 10

# Salvar o payload em um arquivo para inspecionar
$payloadJson | Out-File -FilePath "webhook-payload.json" -Encoding utf8

Write-Host "Tipo de evento: $eventType"
Write-Host "Payload salvo em webhook-payload.json"

# Enviar a requisiu00e7u00e3o
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = $webhookToken
        "asaas-webhook-token" = $webhookToken
    }
    
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payloadJson -Headers $headers -ContentType "application/json"
    
    # Salvar a resposta em um arquivo para inspecionar
    $responseJson = ConvertTo-Json -InputObject $response -Depth 5
    $responseJson | Out-File -FilePath "webhook-response.json" -Encoding utf8
    
    Write-Host "Resposta salva em webhook-response.json"
    Write-Host "Webhook enviado com sucesso!"
} catch {
    Write-Host "Erro ao enviar webhook: $_"
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode"
        
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $responseBody | Out-File -FilePath "webhook-error.json" -Encoding utf8
        
        Write-Host "Erro salvo em webhook-error.json"
    }
}
