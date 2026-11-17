# Funcoes compartilhadas pelos scripts do Nexio CRM local. Nao rode este arquivo direto.
$ErrorActionPreference = "Stop"
$script:raiz = Split-Path -Parent $PSScriptRoot
Set-Location $script:raiz

function Checar($passo) {
  if ($LASTEXITCODE -ne 0) { throw "Falhou em: $passo (codigo $LASTEXITCODE). Copie o erro acima e mande para o Claude." }
}

function Ler-Env {
  $vars = @{}
  if (Test-Path .\.env.local) {
    foreach ($l in Get-Content .\.env.local) {
      if ($l -match '^([A-Z0-9_]+)=(.*)$') { $vars[$matches[1]] = $matches[2].Trim() }
    }
  }
  return $vars
}

function Sha512Hex($texto) {
  $sha = [Security.Cryptography.SHA512]::Create()
  return (($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($texto)) | ForEach-Object { $_.ToString('x2') }) -join '')
}

# Passa as chaves do .env.local para os docker-compose (WAHA e Redis)
function Preparar-EnvDocker {
  $v = Ler-Env
  if (-not $v['WAHA_API_KEY']) { throw "O .env.local nao tem WAHA_API_KEY. Rode o nexio-local\instalar.ps1 primeiro." }
  $env:WAHA_API_KEY_SHA512 = Sha512Hex $v['WAHA_API_KEY']
  $env:WAHA_HMAC_SECRET = $v['WAHA_HMAC_SECRET']
  $env:SRH_TOKEN = $v['UPSTASH_REDIS_REST_TOKEN']
}

function Conferir-Ferramentas {
  $ErrorActionPreference = "Continue"
  docker info *> $null
  $ok = ($LASTEXITCODE -eq 0)
  $ErrorActionPreference = "Stop"
  if (-not $ok) { throw "O Docker Desktop nao esta rodando. Abra o Docker Desktop, espere 'Engine running' e rode de novo." }
  $nodeMajor = [int]((node -v).TrimStart('v').Split('.')[0])
  if ($nodeMajor -lt 22) { throw "Precisa do Node 22 ou mais novo (voce tem $(node -v)). Instale em https://nodejs.org" }
  $pnpmVer = ""
  if (Get-Command pnpm -ErrorAction SilentlyContinue) { $pnpmVer = (pnpm -v) }
  if (-not $pnpmVer.StartsWith("9.")) {
    Write-Host "O projeto usa o pnpm 9 (voce tem '$pnpmVer'). Instalando pnpm 9.15.9..."
    npm install -g pnpm@9.15.9; Checar "instalar pnpm 9"
  }
}

function Subir-Servicos {
  Preparar-EnvDocker
  Write-Host "Subindo n8n, WAHA e Redis..." -ForegroundColor Cyan
  docker compose -f .\nexio-local\n8n\docker-compose.yml up -d; Checar "subir n8n"
  docker compose -f .\nexio-local\waha\docker-compose.yml up -d; Checar "subir WAHA"
  docker compose -f .\nexio-local\redis\docker-compose.yml up -d; Checar "subir Redis"
  Write-Host "Subindo o Supabase local (a primeira vez demora alguns minutos)..." -ForegroundColor Cyan
  npx --yes supabase start --workdir nexio-local -x edge-runtime,logflare,vector; Checar "supabase start"
}

function Preencher-ChavesSupabase {
  $vars = @{}
  foreach ($l in (npx --yes supabase status --workdir nexio-local -o env)) {
    if ($l -match '^([A-Z_]+)="?([^"]*)"?$') { $vars[$matches[1]] = $matches[2] }
  }
  if (-not $vars['ANON_KEY'] -or -not $vars['SERVICE_ROLE_KEY']) { throw "Nao consegui ler as chaves do Supabase. Rode 'npx supabase status --workdir nexio-local' e mande o resultado." }
  $linhas = Get-Content .\.env.local
  $linhas = $linhas -replace '^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', ("NEXT_PUBLIC_SUPABASE_ANON_KEY=" + $vars['ANON_KEY'])
  $linhas = $linhas -replace '^SUPABASE_SERVICE_ROLE_KEY=.*', ("SUPABASE_SERVICE_ROLE_KEY=" + $vars['SERVICE_ROLE_KEY'])
  [IO.File]::WriteAllText((Join-Path $script:raiz ".env.local"), (($linhas -join "`n") + "`n"))
}

function Aplicar-Schema {
  $db = "supabase_db_nexio-crm"
  $existe = (docker exec $db psql -U postgres -d postgres -tAc "select to_regclass('public.organizations') is not null").Trim()
  if ($existe -eq "t") { Write-Host "Banco ja tem o schema, pulando."; return }
  Write-Host "Criando o banco (baseline.sql oficial)..." -ForegroundColor Cyan
  docker exec $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "create extension if not exists vector with schema public; create extension if not exists citext with schema public; create extension if not exists pg_trgm with schema public;"; Checar "criar extensoes"
  docker cp .\supabase\baseline.sql "${db}:/tmp/baseline.sql"; Checar "copiar baseline"
  docker exec $db psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 -f /tmp/baseline.sql; Checar "aplicar baseline"
  Write-Host "Schema aplicado." -ForegroundColor Green
}

function Abrir-Crons {
  if (-not (Test-Path .\.env)) { [IO.File]::WriteAllText((Join-Path $script:raiz ".env"), "# vazio: as variaveis ficam no .env.local`n") }
  Write-Host "Abrindo a janela dos crons (midia, automacoes e follow-ups a cada 15s)..." -ForegroundColor Cyan
  Start-Process powershell -WorkingDirectory $script:raiz -ArgumentList '-NoExit','-Command','$env:NEXT_PUBLIC_APP_URL=''http://127.0.0.1:3000''; Start-Sleep 20; while ($true) { pnpm dev:crons; Write-Host ''App fora do ar, tentando de novo em 10s...''; Start-Sleep 10 }'
}

function Mostrar-Enderecos {
  Write-Host ""
  Write-Host "  Nexio CRM:         http://localhost:3000" -ForegroundColor Green
  Write-Host "  Supabase Studio:   http://127.0.0.1:55423"
  Write-Host "  E-mails de teste:  http://127.0.0.1:55424"
  Write-Host "  n8n:               http://localhost:5678"
  Write-Host "  WAHA (painel):     http://localhost:3030/dashboard"
  Write-Host ""
}
