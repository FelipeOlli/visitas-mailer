# CLAUDE.md — visitas-mailer

## Propósito
Plataforma para disparar campanhas de e-mail HTML para as 1.433 escolas da rede municipal do RJ.
Usa n8n como motor de envio via Gmail API OAuth2.

## Stack
- Next.js 14 App Router + TypeScript + Tailwind
- Prisma 5 + PostgreSQL (banco `mailer` no mesmo servidor do `visitas-v2`)
- next-auth v5 (beta) — credentials
- Deploy: Docker multi-stage + EasyPanel (Hetzner)

## Estrutura
- `app/(app)/templates/` — CRUD de templates HTML
- `app/(app)/campanhas/` — criação, detalhe e disparo
- `app/api/pixel/[id]/` — tracking de abertura (GIF 1x1)
- `app/api/campanhas/[id]/disparar/` — dispara webhook n8n + cria Envios
- `lib/schools.ts` — lê `public/schools.json`, filtros por CRE/bairro/statusVisita
- `components/TemplateForm.tsx` — editor com preview iframe
- `components/CampanhaForm.tsx` — seleção de filtros com contagem ao vivo
- `components/CampanhaDetail.tsx` — dashboard de envios + botão disparar

## Variáveis de ambiente
```
DATABASE_URL=postgresql://...mailer
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://mailer.seudominio.com
N8N_WEBHOOK_URL=https://n8n.seudominio.com/webhook/disparar-campanha
REGISTER_SECRET=...  # segredo para criar usuário via POST /api/register
```

## Primeiro usuário
```sh
curl -X POST https://mailer.xxx/api/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"felipe@...","password":"...","name":"Felipe","secret":"SEU_REGISTER_SECRET"}'
```

## Deploy (EasyPanel)
- Banco: criar database `mailer` no Postgres `sintel_visitasrj-db`
  `CREATE DATABASE mailer;`
- Serviço: novo App no projeto `sintel`
- Build Method: Dockerfile
- Todas as env vars acima como Environment (não Build Args — nada de NEXT_PUBLIC aqui)
- Boot roda `prisma migrate deploy` automaticamente
- n8n: serviço separado `n8nio/n8n:latest`, volume `/home/node/.n8n`

## Workflow n8n
O webhook recebe `{ campanhaId, template, envios[], schools{}, pixelBase }`.
Para cada envio:
1. Substituir variáveis no HTML (`{{nome}}`, `{{cre}}`, `{{bairro}}`, `{{sigla}}`, `{{endereco}}`)
2. Injetar pixel: `<img src="{pixelBase}/{envioId}.gif" width="1" height="1" />`
3. Gmail node OAuth2 → enviar
4. HTTP PATCH `/api/envios/{id}` com `{ status: "enviado", enviadoEm: now }`
5. Wait 18s entre envios (~200/hora)

## Destinatários
- ~80% dos e-mails das escolas são domínios Microsoft (Outlook/Hotmail/Live/Microsoft 365)
- Implicação: entregabilidade e renderização devem ser testadas prioritariamente no Outlook

## Anti-spam
- SPF/DKIM/DMARC configurados no domínio Workspace antes do primeiro disparo
- From = e-mail real do Felipe, Reply-To = mesmo From
- Cadência: 200 e-mails/hora (limite Workspace: 2.000/dia)
- Primeiro disparo: piloto com 50 escolas

## Sessões recentes

### 2026-05-26
- Projeto criado do zero: Next.js 14 + Prisma 5 + next-auth v5
- Implementados: CRUD templates, criação de campanhas com filtros, tracking de abertura pixel, disparo via n8n webhook
- Build limpo, todas as rotas dinâmicas

### 2026-06-01
- Modo "lista manual" no formulário de campanha: toggle escolas/manual, textarea de e-mails, detecção automática de variáveis do template com badge de faltante por contato
- Novo `lib/templateVars.ts` com `extractTemplateVars`; GET adicionado em `/api/templates/[id]`
- Schema: `Campanha.tipoDestinatario` + `Envio.vars Json?` + `Campanha.nome @unique`
- Workflow n8n atualizado: lê `varsPorEnvio`, injeta meta `color-scheme` anti-dark-mode, strip `.gif` no pixel
- Excluir campanha: DELETE `/api/campanhas/[id]` com cascade; botão na lista (hover) e no detalhe; bloqueado em `enviando`
- Listagem de campanhas com coluna Enviados (status `enviado` + `abriu`)
- Tracking por pixel no Gmail é impreciso: Google proxy busca imagens na entrega, não na abertura real — limitação conhecida, sem solução via pixel
- Coluna "Aberto" na tabela de envios exibe data + hora (toLocaleTimeString HH:MM)
