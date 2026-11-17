# Nexio CRM - ambiente local (Windows)

Tudo o que precisa para rodar o Nexio CRM no seu PC. Os segredos NAO ficam aqui:
o `instalar.ps1` gera um `.env.local` novo em cada maquina (e o git ignora esse arquivo).

## Maquina nova
Pre-requisitos: Docker Desktop aberto, Node 22+, Git.

```powershell
cd "$HOME\Documents"
git clone https://github.com/Jardel-goncalvesbr/NexioCRM nexio-crm-app
cd nexio-crm-app
powershell -ExecutionPolicy Bypass -File .\nexio-local\instalar.ps1
```
Depois, em outro terminal: `powershell -ExecutionPolicy Bypass -File .\nexio-local\criar-admin.ps1`

## Dia a dia (sempre dentro da pasta nexio-crm-app)
| Para | Comando |
|---|---|
| Desenvolver | `powershell -ExecutionPolicy Bypass -File .\nexio-local\iniciar.ps1` |
| Testar como producao | `powershell -ExecutionPolicy Bypass -File .\nexio-local\producao.ps1` |
| Recompilar producao | `powershell -ExecutionPolicy Bypass -File .\nexio-local\producao.ps1 -Recompilar` |
| Parar tudo | `powershell -ExecutionPolicy Bypass -File .\nexio-local\parar.ps1` |
| Criar usuario dono | `powershell -ExecutionPolicy Bypass -File .\nexio-local\criar-admin.ps1` |

## Enderecos
- Nexio CRM: http://localhost:3000
- Supabase Studio: http://127.0.0.1:55423
- E-mails de teste: http://127.0.0.1:55424
- n8n: http://localhost:5678
- WAHA: http://localhost:3030/dashboard
