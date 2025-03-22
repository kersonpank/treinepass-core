# Script PowerShell para testar uma sequência de eventos do webhook do Asaas

# Configurações
$webhookUrl = "https://jlzkwcgzpfrdgcdjmjao.supabase.co/functions/v1/asaas-webhook"

# Ler o token do arquivo .env
$envContent = Get-Content -Path "../.env" -ErrorAction SilentlyContinue
$webhookToken = ($envContent | Where-Object { $_ -match "^ASAAS_WEBHOOK_TOKEN=(.*)$" } | ForEach-Object { $matches[1] })

Write-Host "Usando token: $webhookToken"

# Gerar IDs únicos para uso em toda a sequência
$paymentId = "pay_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$customerId = "cus_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$subscriptionId = "sub_" + [Guid]::NewGuid().ToString().Substring(0, 8)
$today = Get-Date -Format "yyyy-MM-dd"

# Função para enviar um evento
function Send-WebhookEvent {
    param (
        [string]$EventType,
        [string]$PaymentId,
        [string]$CustomerId,
        [string]$SubscriptionId,
        [string]$PaymentStatus
    )
    
    $eventId = "evt_" + [Guid]::NewGuid().ToString().Substring(0, 8) + "&" + (Get-Random -Minimum 1000000 -Maximum 9999999)
    $dateCreated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($EventType -like "PAYMENT*") {
        $payload = @{
            id = $eventId
            event = $EventType
            payment = @{
                id = $PaymentId
                customer = $CustomerId
                value = 99.90
                netValue = 96.90
                billingType = "CREDIT_CARD"
                status = $PaymentStatus
                dueDate = $today
                paymentDate = $today
                description = "Assinatura TreinePass - Sequência"
                externalReference = "user_sequence"
                invoiceUrl = "https://www.asaas.com/i/sequence"
                invoiceNumber = "12345678"
                subscription = $SubscriptionId
            }
            dateCreated = $dateCreated
        }
    } else {
        $payload = @{
            id = $eventId
            event = $EventType
            subscription = @{
                id = $SubscriptionId
                customer = $CustomerId
                value = 99.90
                nextDueDate = $today
                description = "Assinatura TreinePass - Sequência"
                externalReference = "user_sequence"
                status = "ACTIVE"
            }
            dateCreated = $dateCreated
        }
    }
    
    $payloadJson = ConvertTo-Json -InputObject $payload -Depth 10
    
    # Salvar o payload em um arquivo para inspecionar
    $fileName = "webhook-sequence-$($EventType).json"
    $payloadJson | Out-File -FilePath $fileName -Encoding utf8
    
    Write-Host "Enviando evento $EventType..."
    Write-Host "Payload salvo em $fileName"
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = $webhookToken
            "asaas-webhook-token" = $webhookToken
        }
        
        $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payloadJson -Headers $headers -ContentType "application/json"
        
        # Salvar a resposta em um arquivo para inspecionar
        $responseFileName = "webhook-sequence-response-$($EventType).json"
        $responseJson = ConvertTo-Json -InputObject $response -Depth 5
        $responseJson | Out-File -FilePath $responseFileName -Encoding utf8
        
        Write-Host "Resposta salva em $responseFileName"
        Write-Host "Evento $EventType enviado com sucesso!"
        Write-Host ""
        
        return $true
    } catch {
        Write-Host "Erro ao enviar evento $EventType: $_"
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "Status Code: $statusCode"
            
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $errorFileName = "webhook-sequence-error-$($EventType).json"
            $responseBody | Out-File -FilePath $errorFileName -Encoding utf8
            
            Write-Host "Erro salvo em $errorFileName"
        }
        
        return $false
    }
}

# Sequência de eventos para testar
$eventSequence = @(
    @{EventType = "SUBSCRIPTION_CREATED"; PaymentStatus = "PENDING"},
    @{EventType = "PAYMENT_CREATED"; PaymentStatus = "PENDING"},
    @{EventType = "PAYMENT_RECEIVED"; PaymentStatus = "RECEIVED"},
    @{EventType = "PAYMENT_CONFIRMED"; PaymentStatus = "CONFIRMED"}
)

Write-Host "Iniciando sequência de teste com:"
Write-Host "Payment ID: $paymentId"
Write-Host "Customer ID: $customerId"
Write-Host "Subscription ID: $subscriptionId"
Write-Host ""

# Enviar eventos em sequência
foreach ($event in $eventSequence) {
    $success = Send-WebhookEvent -EventType $event.EventType -PaymentId $paymentId -CustomerId $customerId -SubscriptionId $subscriptionId -PaymentStatus $event.PaymentStatus
    
    if (-not $success) {
        Write-Host "Falha ao enviar evento $($event.EventType). Interrompendo sequência."
        break
    }
    
    # Aguardar um pouco entre os eventos
    Start-Sleep -Seconds 2
}

Write-Host "Sequência de teste concluída."
Write-Host "Verifique os arquivos de resposta para ver os resultados."
