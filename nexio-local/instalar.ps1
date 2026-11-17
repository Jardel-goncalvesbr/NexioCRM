# Nexio CRM - instalacao local (uma vez por maquina). Gera o .env.local com segredos novos e sobe tudo.
# Uso (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File .\nexio-local\instalar.ps1
. "$PSScriptRoot\_comum.ps1"

function Hex32 { $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); return (($b | ForEach-Object { $_.ToString('x2') }) -join '') }
function B64_32 { $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); return [Convert]::ToBase64String($b) }

Write-Host "`n[1/3] Conferindo ferramentas..." -ForegroundColor Cyan
Conferir-Ferramentas

if (Test-Path .\.env.local) {
  Write-Host "`n[2/3] .env.local ja existe nesta maquina, mantendo." -ForegroundColor Cyan
} else {
  Write-Host "`n[2/3] Gerando .env.local com segredos novos..." -ForegroundColor Cyan
  $conteudo = @"
# ===== Nexio CRM - ambiente LOCAL (gerado pelo nexio-local\instalar.ps1) =====
# NUNCA envie este arquivo para o GitHub. As chaves do Supabase sao preenchidas pelo iniciar.ps1.
NEXT_PUBLIC_SUPABASE_URL=http://supabase.localhost:55421
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SERVER_URL=http://127.0.0.1:55421
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:55422/postgres
SUPABASE_DB_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:55422/postgres

# Marca
APP_NAME=Nexio CRM
APP_ACCENT_HEX=#7C3AED
APP_LOCALE=pt-BR
SUPPORT_EMAIL=contato@nexiodigital.com.br
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000

# Segredos (mesmo formato do instalador oficial)
INTERNAL_SECRET=$(Hex32)
INTERNAL_CRON_SECRET=$(Hex32)
NUVEMSHOP_OAUTH_ENCRYPTION_KEY=$(Hex32)
CPF_ENCRYPTION_KEY=$(B64_32)
AI_CRED_AES_KEY=$(B64_32)
WAHA_BYO_ENCRYPTION_KEY=$(B64_32)
IMPERSONATE_COOKIE_SECRET=$(Hex32)
LGPD_SIGNING_KEY=$(Hex32)

# WhatsApp (WAHA local)
WAHA_API_BASE_URL=http://localhost:3030
WAHA_API_KEY=$(Hex32)
WAHA_HMAC_SECRET=$(Hex32)
WAHA_WEBHOOK_BASE_URL=http://host.docker.internal:3000
WAHA_WEBHOOK_REQUIRE_SIGNATURE=false
META_GRAPH_VERSION=v22.0

# Redis local (obrigatorio em modo producao)
UPSTASH_REDIS_REST_URL=http://127.0.0.1:8079
UPSTASH_REDIS_REST_TOKEN=$(Hex32)

# Padroes do projeto
AI_BUDGET_ENFORCEMENT=on
NUVEMSHOP_ENABLED=false
AGENT_DISPATCH_CONSUMER=engine
"@
  [IO.File]::WriteAllText((Join-Path $script:raiz ".env.local"), ($conteudo -replace "`r`n", "`n"))
  Write-Host ".env.local criado." -ForegroundColor Green
}

Write-Host "`n[3/3] Subindo o ambiente pela primeira vez..." -ForegroundColor Cyan
& "$PSScriptRoot\iniciar.ps1"
