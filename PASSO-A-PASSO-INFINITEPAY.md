# InfinitePay — assinatura do NutriLab

## ✅ Já feito (em 26/07/2026)
- Plano criado no InfinitePay: **NutriLab Profissional · R$ 49,90/mês** (assinatura mensal, cobrança dia 26).
- Link do checkout: `https://invoice.infinitepay.io/plans/analuisarocha/AOoThqZeRC`
- Link já colado no paywall (`assinatura.html`) e preço atualizado para R$ 49,90.
- Botão **"Assinar agora"** agora leva a nutri direto para o checkout do InfinitePay.

## ⏳ Falta (precisa de um pagamento real para testar)
A **liberação automática de acesso** assim que a nutri paga ainda não está ligada, porque
o InfinitePay não pediu uma URL de webhook ao criar o plano. Duas formas de resolver:

1. **Webhook** (se existir no painel): procurar em Configurações / Desenvolvedor / Integrações
   uma opção de **URL de notificação** e cadastrar:
   ```
   https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/assinatura-webhook
   ```
2. **Consulta ativa (payment_check)**: se não houver webhook, confirmo o pagamento consultando
   a API do InfinitePay — o mesmo esquema que já funciona no e-book de Rótulos.

Para eu fechar isso, o ideal é **1 assinatura de teste real** (pode cancelar/estornar depois):
assim eu vejo o formato exato da notificação/consulta e deixo a liberação 100% automática.
Enquanto isso não é feito, dá para **liberar o acesso manualmente** (ativar a assinatura da
nutri pelo painel Admin), então a venda não fica bloqueada.
