# E-mail próprio (SMTP) — para os e-mails da plataforma saírem em português

## O problema
O primeiro e-mail que uma compradora recebe é o convite para criar a senha. Hoje ele chega
no padrão do Supabase, **em inglês** ("You've been invited"), sem a nossa cara.

Tentei traduzir e o Supabase recusou, com esta mensagem:

> Email template modification is not available for free tier projects using the default
> email provider. Please upgrade your plan or configure a custom SMTP provider.

Ou seja: **enquanto o projeto usar o serviço de e-mail embutido do Supabase, não dá para
mudar o texto.** E esse serviço embutido é limitado de propósito (é para teste, não para
venda) — a compradora pode simplesmente não receber o convite.

Os dois problemas — texto em inglês e entrega não confiável — se resolvem com a mesma
coisa: **SMTP próprio**.

## O que falta (é seu, precisa de cartão e do seu e-mail)

### 1. Comprar o domínio
No [registro.br](https://registro.br) — algo como `analuisarocha.com.br`, ~R$40/ano.
Esse domínio serve para três coisas de uma vez: o e-mail da plataforma, um endereço de site
decente no lugar de `nutrianarocha.github.io`, e a marca quando a plataforma abrir para
outras nutris.

> Por que não dá sem domínio: o Resend só envia de domínio verificado — o endereço de teste
> dele (`onboarding@resend.dev`) só entrega no e-mail da dona da conta. E enviar "em nome do
> Gmail" por outro serviço faz o e-mail cair em spam, porque o Gmail não autoriza isso.

### 2. Criar a conta no Resend
[resend.com](https://resend.com) — grátis até 3.000 e-mails/mês, folgado para o começo.
Em **Domains → Add Domain**, coloque o domínio comprado. O Resend mostra ~3 registros
(SPF, DKIM, DMARC) para colar no painel do registro.br. Se travar aqui, me chame que eu faço.

### 3. Criar a chave e me mandar
Em **API Keys → Create API Key**. Guarde o valor (começa com `re_`) — ele só aparece uma vez.

## O que eu faço quando você me passar isso
Um comando só, que liga o SMTP e traduz os três e-mails na mesma tacada:

```bash
python configurar_email.py --host smtp.resend.com --port 465 \
    --user resend --pass re_SUACHAVE --de contato@seudominio.com.br
```

Depois eu convido um e-mail de teste em Authentication → Users → Invite e confiro que
chega, em português, com a sua assinatura e o CRN.

## Os textos já estão escritos e revisados
Estão em `configurar_email.py` — os três e-mails (convite, redefinir senha, confirmar
e-mail), com a caixa branca sobre fundo rosado, o botão em vinho e a assinatura com CRN.
Prévia navegável do convite: `previa-email-convite.html`.

O convite é **compartilhado**: o mesmo e-mail vai para quem compra e-book, para quem entra
no "Meu Plano" e para uma nutri convidada. Por isso ele não cita produto nenhum — citar
sairia errado em dois dos três casos.
