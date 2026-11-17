# Nexio CRM - sobe o ambiente de DESENVOLVIMENTO (servicos + crons + pnpm dev)
# Uso:  powershell -ExecutionPolicy Bypass -File .\nexio-local\iniciar.ps1
. "$PSScriptRoot\_comum.ps1"
if (-not (Test-Path .\.env.local)) { throw "Falta o .env.local. Rode primeiro: .\nexio-local\instalar.ps1" }

Write-Host "`n[1/5] Conferindo ferramentas..." -ForegroundColor Cyan
Conferir-Ferramentas
Write-Host "`n[2/5] Servicos..." -ForegroundColor Cyan
Subir-Servicos
Write-Host "`n[3/5] Chaves e banco..." -ForegroundColor Cyan
Preencher-ChavesSupabase
Aplicar-Schema
Write-Host "`n[4/5] Dependencias do app..." -ForegroundColor Cyan
pnpm install --frozen-lockfile; Checar "pnpm install"
Write-Host "`n[5/5] Tudo pronto." -ForegroundColor Green
Mostrar-Enderecos
Abrir-Crons
Write-Host "Iniciando o app em modo desenvolvimento (Ctrl+C para parar)...`n"
pnpm dev
