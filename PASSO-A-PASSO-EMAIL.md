# E-mail próprio (Resend) — para os e-mails da NutriPlat saírem de verdade

Atualizado em 18/09/2026. A versão antiga deste arquivo dizia que faltava comprar domínio —
**o domínio já existe**: `nutrianaluisarocha.com` (Hostinger), com o app em
`app.nutrianaluisarocha.com`.

## O que depende disso

**1. Aviso de renovação.** A renovação assistida está no ar (a InfinitePay não cobra sozinha,
então a plataforma avisa 5 dias antes e dá 3 dias de carência). Só que **o e-mail não sai**:
sem provedor, a edge function `nutriplat-renovacao` grava cada aviso com canal
`sem_provedor`, `ok=false`, e o card "Avisos de renovação" em Admin mostra
"Os e-mails não estão saindo".

**2. E-mails de autenticação em português.** No plano gratuito o Supabase recusa template
customizado enquanto o projeto usa o e-mail embutido:

> Email template modification is not available for free tier projects using the default
> email provider.

Com SMTP próprio, os três e-mails (convite, redefinir senha, confirmar e-mail) passam a sair
no texto da Ana — `configurar_email.py` faz as duas coisas numa tacada.

**3. Convite de nutri** (`criar-conta-nutri`) usa os mesmos dois secrets.

## Estado do DNS (conferido em 18/09/2026)

O domínio está limpo do lado de e-mail — **não há MX nem SPF**, então os registros do Resend
entram sem conflito com nada:

| Tipo | Existe hoje |
|---|---|
| NS | `ns1.dns-parking.com`, `ns2.dns-parking.com` (Hostinger) |
| MX | nenhum |
| TXT | só o `google-site-verification` do Search Console |

Ao publicar os registros do Resend: **só adicionar**. Não mexer nos A, no CNAME `app` nem no
TXT do Google.

## Feito em 18/09/2026

- **Conta no Resend criada** (login com o Google da Ana, `nutrianalrocha@gmail.com`).
  Plano gratuito: 3.000 e-mails/mês, 100/dia — sobra muito para avisos de renovação.
- **Domínio `nutrianaluisarocha.com` adicionado**, região São Paulo (`sa-east-1`),
  tracking de clique e abertura desligado (reescreve link e insere pixel; piora entrega).
  Id do domínio no Resend: `9440a0ce-b86d-474c-a364-805cde473aaf`.
- **API key criada**: nome `NutriPlat renovacao`, permissão *Sending access*.

- **DNS publicado e domínio Verified** (18/09). Registros abaixo, para referência.
- **Secrets gravados** e **teste ponta a ponta feito**: conta QA vencendo em 5 dias, a
  function devolveu `enviados:1, falhas:0`, `renovacao_avisos` ficou com `canal='email',
  ok=true` e o Resend marcou **Delivered**. Conta QA apagada.
  Reproduzir com `python teste_renovacao_qa.py`.

- **SMTP do Supabase ligado** (18/09, mesma chave): `smtp.resend.com:465`, usuário `resend`,
  remetente `NutriPlat <contato@nutrianaluisarocha.com>`, `rate_limit_email_sent = 100`.
  Os três templates de autenticação passaram a sair em português.
  Conferido de ponta a ponta: conta QA criada, `POST /auth/v1/recover` devolveu 200 e o
  e-mail chegou na **caixa de entrada** do Gmail (não no spam) como
  "NutriPlat — Redefinir a sua senha", em português, sem alerta de spoofing. QA apagada
  pelo id, e o endpoint de login seguiu respondendo `invalid_credentials` a senha errada.

**Está tudo no ar.** A `criar-conta-nutri` não dependia disso — ela já monta o e-mail em
português e chama a API do Resend direto. Quem passou a sair em português são os convites
dos webhooks (`infinitepay-webhook`, `assinatura-webhook`, `programa-webhook`, todos via
`inviteUserByEmail`) e o "esqueci a senha" do app.

## Registros publicados (referência)

### 1. Zona DNS da Hostinger
hPanel → Domínios → `nutrianaluisarocha.com` → DNS → Manage DNS records → Add Record.
**Só adicionar.** Não mexer nos dois ALIAS (`@` e `app`) nem no TXT do Google.

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9fRsNfg+rfpIdu3vvP/ScMwZhMq9DNqT/PY8UULNaNthxdh90NKYh0+mpCbrL9vbvsNo2QNOtH8J2z2z92ixwShPWJvIwrJ9pMOa45Qi5ykax4S041JVevHBjDUl2e7PLoFPNeAJHjsDZBGjJf5fASyjx1mcjcbaFxM0m3stlXwIDAQAB` | Auto |
| CNAME | `rsend` | `rsend-sae1.forge.rmta.net` | 3600 |
| CNAME | `send` | `send.forge.rmta.net` | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto |

O DKIM é chave **pública** — pode ficar escrito aqui sem risco.

**Não publicar** o quarto bloco que o Resend mostra, o *Enable Receiving*
(`MX @ → inbound-smtp.sa-east-1.amazonaws.com`, prioridade 10): ele serve para o domínio
**receber** e-mail pelo Resend e tomaria o MX do domínio inteiro. A NutriPlat só precisa
enviar. Se um dia a Ana quiser caixa de entrada no domínio, essa decisão se revisita.

Depois de salvar, voltar ao Resend › Domains e clicar em **Verify**.

### 2. Me passar a API key (`re_...`)
A chave aparece **uma única vez**, na hora em que é criada. Se tiver sido perdida, é só
apagar a `NutriPlat renovacao` em Resend › API keys e criar outra igual.

Com a chave na mão, o resto é um comando:

```
python ligar_resend.py --key re_xxxxxxxx
```

Ele grava `RESEND_API_KEY` e `EMAIL_REMETENTE` como secrets do projeto pela Management API,
confere que os dois entraram, lê o segredo do cron no cofre e chama a function em teste seco.
Para disparar de verdade: `python ligar_resend.py --so-teste --enviar`.

Remetente combinado: `NutriPlat <contato@nutrianaluisarocha.com>` — mesmo formato que a
function `criar-conta-nutri` já espera.

### 3. O SMTP do Supabase (feito em 18/09 — mesma chave)
```
python configurar_email.py --host smtp.resend.com --port 465 --user resend \
    --pass re_xxxxxxxx --de contato@nutrianaluisarocha.com
```
Isso destrava os templates em português dos e-mails de autenticação.

## Como conferir que ficou bom
1. `python ligar_resend.py --so-teste` → tem de listar os dois secrets.
2. Conta QA com `assinatura_expira_em = hoje + 5 dias`, rodar com `--enviar` e checar em
   `renovacao_avisos` que veio `canal='email'`, `ok=true`.
3. O e-mail chegando na caixa. Depois, apagar a conta QA.
