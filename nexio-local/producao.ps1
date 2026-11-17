# Nexio CRM - roda em MODO PRODUCAO no seu PC (compilado, sem o modo de desenvolvimento)
# Uso:  powershell -ExecutionPolicy Bypass -File .\nexio-local\producao.ps1
# Depois de mudar codigo ou .env.local:  ...\producao.ps1 -Recompilar
param([switch]$Recompilar)
. "$PSScriptRoot\_comum.ps1"
if (-not (Test-Path .\.env.local)) { throw "Falta o .env.local. Rode primeiro: .\nexio-local\instalar.ps1" }

Write-Host "`n[1/4] Conferindo ferramentas e servicos..." -ForegroundColor Cyan
Conferir-Ferramentas
Subir-Servicos
Preencher-ChavesSupabase
Aplicar-Schema
pnpm install --frozen-lockfile; Checar "pnpm install"

if ($Recompilar -or -not (Test-Path .\.next\BUILD_ID)) {
  Write-Host "`n[2/4] Compilando para producao (leva alguns minutos)..." -ForegroundColor Cyan
  if (Test-Path .\.next) { cmd /c "rmdir /s /q .next" }
  $env:NODE_OPTIONS = "--max-old-space-size=6144"
  pnpm build; Checar "pnpm build"
} else { Write-Host "`n[2/4] Usando a compilacao existente (use -Recompilar para refazer)." }

Write-Host "`n[3/4] Crons..." -ForegroundColor Cyan
Abrir-Crons
Write-Host "`n[4/4] Nexio CRM em modo PRODUCAO (Ctrl+C para parar)" -ForegroundColor Green
Mostrar-Enderecos
pnpm start
