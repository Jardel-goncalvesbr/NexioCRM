# Nexio CRM na VPS Hostinger (Gerenciador Docker)

Sobe o Nexio CRM em `https://crm.nexiodigital.com.br` sem terminal, pelo Gerenciador Docker do hPanel.

## Pré-requisitos
- Projeto Docker `nexio` (Traefik + n8n + WAHA) rodando na mesma VPS. O CRM usa o Traefik dele (rede `nexio_default`, certresolver `le`).
- Registro DNS `A crm` apontando para o IP da VPS.
- Projeto no Supabase Cloud (região São Paulo).

## O que este compose faz
| Serviço | Função |
| --- | --- |
| `segredos` | Gera os segredos internos (uma vez) no volume `crm_segredos`. Nada vai para o Git. |
| `banco` | Habilita as extensões, aplica `baseline.sql` do DeskcommCRM v1.124.0 (idempotente) e cria/promove o primeiro admin. |
| `app` | Nexio CRM (Next.js), publicado pelo Traefik. |
| `worker` | Agente de IA. |
| `scheduler` | Rotinas agendadas. |
| `waha` | WhatsApp interno do CRM (painel desligado, webhook com HMAC para o app). |
| `redis` + `srh` | Fila e limites (Upstash compatível, interno). |

Marca: `APP_NAME=Nexio CRM`, logo da Nexio e cor `#8020e7`, por variável, sem gerar imagem própria.

## Variáveis no campo "Ambiente" do projeto (preencha você)
| Variável | Onde pegar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | mesma tela, chave `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | mesma tela, chave `service_role` |
| `SUPABASE_DB_URL` | botão Connect > **Session pooler** (porta 5432), com a senha do banco no lugar de `[YOUR-PASSWORD]`. Não use a Direct connection (só IPv6). |
| `OWNER_EMAIL` | seu e-mail de login no CRM |
| `OWNER_PASSWORD` | sua senha de login no CRM (sem aspas `"` nem barra `\`) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | opcionais (a chave de IA também pode ser cadastrada depois na tela do CRM) |

Depois do primeiro deploy com sucesso, apague `OWNER_PASSWORD` do Ambiente (o admin já existe; reimplantar continua funcionando).

## Passo a passo
1. hPanel > VPS > Gerenciador Docker > Compose > **Compose a partir de URL**.
2. URL: `https://raw.githubusercontent.com/Jardel-goncalvesbr/NexioCRM/main/deploy/hostinger/docker-compose.yml` · Nome do projeto: `nexio-crm`.
3. Abra o projeto (Gerenciar) > **Ambiente** e preencha as variáveis acima. Clique em **Implantar**.
4. Acompanhe a aba **Logs**: `segredos gerados` → `schema ok` → `admin ok`. O primeiro schema leva alguns minutos.
5. Acesse `https://crm.nexiodigital.com.br` com `OWNER_EMAIL` / `OWNER_PASSWORD` e conecte o WhatsApp em **Conexões**.

## Atualizar a versão
Troque `1.124.0` nas três imagens **e** `v1.124.0` em `BASELINE_URL` pelo mesmo número novo e reimplante. O serviço `banco` reaplica o schema em modo atualização.
