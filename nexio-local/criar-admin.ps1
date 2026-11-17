# Nexio CRM - cria um usuario dono + super-admin (com o ambiente rodando)
# Uso:  powershell -ExecutionPolicy Bypass -File .\nexio-local\criar-admin.ps1
. "$PSScriptRoot\_comum.ps1"
$email = Read-Host "E-mail de login"
$seg   = Read-Host "Senha (minimo 8 caracteres)" -AsSecureString
$org   = Read-Host "Nome da empresa [Enter = Nexio Digital]"
if (-not $org) { $org = "Nexio Digital" }
$v = Ler-Env
foreach ($k in $v.Keys) { [Environment]::SetEnvironmentVariable($k, $v[$k], "Process") }
$env:OWNER_EMAIL = $email
$env:OWNER_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($seg))
$env:OWNER_ORG_NAME = $org
try {
  pnpm exec tsx scripts/bootstrap-owner.ts; Checar "criar usuario"
  Write-Host "`nPronto! Entre em http://localhost:3000/login com $email." -ForegroundColor Green
} finally { Remove-Item Env:OWNER_PASSWORD -ErrorAction SilentlyContinue }
