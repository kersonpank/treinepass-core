# Script para executar comandos SQL no Supabase via API REST

param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile,
    
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl = $env:SUPABASE_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$SupabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

# Verificar se as variu00e1veis de ambiente estu00e3o definidas
if (-not $SupabaseUrl) {
    Write-Error "SUPABASE_URL nu00e3o estu00e1 definido. Defina a variu00e1vel de ambiente ou passe como paru00e2metro."
    exit 1
}

if (-not $SupabaseKey) {
    Write-Error "SUPABASE_SERVICE_ROLE_KEY nu00e3o estu00e1 definido. Defina a variu00e1vel de ambiente ou passe como paru00e2metro."
    exit 1
}

# Verificar se o arquivo SQL existe
if (-not (Test-Path $SqlFile)) {
    Write-Error "Arquivo SQL nu00e3o encontrado: $SqlFile"
    exit 1
}

# Ler o conteu00fado do arquivo SQL
$sqlContent = Get-Content -Path $SqlFile -Raw

# Exibir o conteu00fado do arquivo SQL
Write-Host "Executando SQL do arquivo: $SqlFile"
Write-Host "Conteu00fado:"
Write-Host "$sqlContent"
Write-Host ""

# Construir a URL da API REST do Supabase
$apiUrl = "$SupabaseUrl/rest/v1/rpc/exec_sql"

# Construir o corpo da requisiu00e7u00e3o
$body = @{
    "sql" = $sqlContent
} | ConvertTo-Json

# Construir os headers da requisiu00e7u00e3o
$headers = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Fazer a requisiu00e7u00e3o para a API REST do Supabase
try {
    Write-Host "Enviando requisiu00e7u00e3o para: $apiUrl"
    
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $body
    
    Write-Host "SQL executado com sucesso!"
    Write-Host "Resposta:"
    $response | ConvertTo-Json -Depth 10
    
    return $response
} catch {
    Write-Error "Erro ao executar SQL: $_"
    Write-Error $_.Exception.Response.StatusCode.value__
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Error $responseBody
    }
    exit 1
}
