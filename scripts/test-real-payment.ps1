# Script PowerShell para testar o webhook do Asaas com um pagamento real

# Configurau00e7u00f5es
$webhookUrl = "https://jlzkwcgzpfrdgcdjmjao.supabase.co/functions/v1/asaas-webhook"

# Ler o token do arquivo .env
$envContent = Get-Content -Path "../.env" -ErrorAction SilentlyContinue
$webhookToken = ($envContent | Where-Object { $_ -match "^ASAAS_WEBHOOK_TOKEN=(.*)$" } | ForEach-Object { $matches[1] })

Write-Host "Usando token: $webhookToken"

# Gerar IDs u00fanicos
$eventId = "evt_" + [Guid]::NewGuid().ToString().Substring(0, 8) + "&" + (Get-Random -Minimum 1000000 -Maximum 9999999)
$today = Get-Date -Format "yyyy-MM-dd"
$dateCreated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Solicitar ID do pagamento real
$paymentId = Read-Host -Prompt "Digite o ID do pagamento real (ex: pay_123456789)"

if ([string]::IsNullOrEmpty($paymentId)) {
    Write-Host "ID do pagamento u00e9 obrigatu00f3rio. Saindo..."
    exit
}

# Payload de teste com pagamento real
$payload = @{
    id = $eventId
    event = "PAYMENT_CONFIRMED"
    payment = @{
        id = $paymentId
        customer = "cus_real"
        value = 99.90
        netValue = 96.90
        billingType = "CREDIT_CARD"
        status = "CONFIRMED"
        dueDate = $today
        paymentDate = $today
        description = "Assinatura TreinePass - Teste Real"
        externalReference = "user_real"
        invoiceUrl = "https://www.asaas.com/i/real"
        invoiceNumber = "12345678"
    }
    dateCreated = $dateCreated
}

$payloadJson = ConvertTo-Json -InputObject $payload -Depth 10

# Salvar o payload em um arquivo para inspecionar
$payloadJson | Out-File -FilePath "webhook-real-payload.json" -Encoding utf8

Write-Host "Payload salvo em webhook-real-payload.json"

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
    $responseJson | Out-File -FilePath "webhook-real-response.json" -Encoding utf8
    
    Write-Host "Resposta salva em webhook-real-response.json"
    Write-Host "Webhook enviado com sucesso!"
} catch {
    Write-Host "Erro ao enviar webhook: $_"
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode"
        
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $responseBody | Out-File -FilePath "webhook-real-error.json" -Encoding utf8
        
        Write-Host "Erro salvo em webhook-real-error.json"
    }
}
