# Nexio CRM - para todos os servicos (os dados ficam salvos)
# Uso:  powershell -ExecutionPolicy Bypass -File .\nexio-local\parar.ps1
. "$PSScriptRoot\_comum.ps1"
Preparar-EnvDocker
npx --yes supabase stop --workdir nexio-local
docker compose -f .\nexio-local\waha\docker-compose.yml down
docker compose -f .\nexio-local\redis\docker-compose.yml down
docker compose -f .\nexio-local\n8n\docker-compose.yml down
Write-Host "Ambiente parado. Feche tambem a janela dos crons e o terminal do app (Ctrl+C)." -ForegroundColor Green
