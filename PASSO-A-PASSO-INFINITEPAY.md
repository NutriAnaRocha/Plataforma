# Passo a passo — ligar o pagamento da assinatura (InfinitePay)

Objetivo: criar a cobrança recorrente de **R$ 89,90/mês** do NutriLab e me mandar o link
para eu colar na plataforma. O login é seu (por QR/celular), então esta parte é você quem faz —
mas é rápido. Qualquer dúvida, me chama que eu te ajudo em tempo real.

## 1. Entrar no InfinitePay
- Abra o app do InfinitePay (ou o painel web) com a sua conta (handle **analuisarocha**).

## 2. Criar uma cobrança recorrente (assinatura)
- Procure por **"Link de pagamento"** → opção de **assinatura / cobrança recorrente**
  (nomes possíveis: "Assinaturas", "Cobrança recorrente", "Plano").
- Configure:
  - **Valor:** R$ 89,90
  - **Recorrência:** mensal
  - **Nome do plano:** NutriLab Profissional
  - **Descrição (opcional):** Acesso mensal à plataforma NutriLab

## 3. (Se aparecer a opção) apontar o webhook
- Se o InfinitePay pedir uma **URL de notificação / webhook**, cole exatamente:

  ```
  https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/assinatura-webhook
  ```

- Se **não** aparecer essa opção no plano de assinatura, tudo bem — me avise. Eu ajusto a
  forma de confirmar o pagamento (dá pra confirmar consultando a InfinitePay, como já faço
  no e-book de Rótulos).

## 4. Copiar o link e me mandar
- Ao salvar, o InfinitePay gera um **link de pagamento**. Copie e me mande.
- Eu colo esse link no lugar certo (`assinatura.html`, variável `LINK_ASSINATURA`) e dou push.
  A partir daí o botão **"Assinar agora"** leva a nutri direto pro checkout.

## 5. Um pagamento de teste (recomendado)
- Depois que eu colar o link, faça **1 pagamento de teste** (pode cancelar/estornar depois).
- Isso me deixa ver os **nomes reais dos campos** que a InfinitePay envia e deixar a
  liberação automática de acesso 100% redonda.

---

### Onde isso encaixa no que já está pronto
- A tela de paywall (`assinatura.html`) já existe, com o plano e o preço.
- O período de teste (trial de 14 dias) e o bloqueio pós-trial já funcionam.
- Convites de nutris entram como cortesia de 12 meses (não passam pelo pagamento).
- Só falta **o link** pra fechar o funil de venda self-serve.
