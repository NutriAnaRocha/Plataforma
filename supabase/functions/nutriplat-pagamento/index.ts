// ============================================================
//  nutriplat-pagamento — a assinatura da nutri pela InfinitePay (17/09/2026)
//
//    { acao: "link", ciclo: "mensal" | "anual" }       (com login)
//        -> cria o link de checkout DELA: o id da conta vai no order_nsu
//           ("nutriplat-mensal~<uuid>") e o preço sai de nutriplat_preco()
//           — entrada, cheio ou anual, com o mês extra de quem veio por cupom.
//
//    { acao: "confirmar", transaction_nsu, order_nsu, slug }   (redirect)
//    POST cru da InfinitePay (?webhook=1)                       (webhook)
//        -> os dois caem em confirmar(): pergunta ao /payment_check se o
//           pagamento existe e foi pago e só então chama
//           registrar_pagamento_nutriplat, que ativa a assinatura e lança a
//           comissão da embaixadora. Idempotente pelo transaction_nsu.
//
//  Por que o id no order_nsu: a API de checkout só cria link avulso (não há
//  recorrência) e o webhook real não traz e-mail nem nome — ver
//  mercado-webhook. O order_nsu é o único campo que é nosso.
//
//  verify_jwt = false: o webhook chega sem JWT. A ação "link" confere o
//  login aqui dentro.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const HANDLE = "analuisarocha";
const VOLTA = "https://app.nutrianaluisarocha.com/assinatura";
const WEBHOOK = "https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/nutriplat-pagamento?webhook=1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// O parcelado repassa juros ao comprador (paga MAIS); aceitar até 5% a menos
// cobre arredondamento sem abrir brecha para quem pagou o mensal e quer o anual.
const TOLERANCIA = 0.95;

function pick(obj: unknown, paths: string[]): string | null {
  for (const p of paths) {
    const v = p.split(".").reduce((o: any, k) => (o == null ? o : o[k]), obj as any);
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

// "nutriplat-anual~<uuid>" -> { ciclo, user }
function partir(order: string) {
  const m = /^nutriplat-(mensal|semestral|anual)~(.+)$/.exec(order || "");
  if (!m || !UUID.test(m[2])) return null;
  return { ciclo: m[1], user: m[2].toLowerCase() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const URL_SB = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const ehWebhook = new URL(req.url).searchParams.get("webhook") === "1";

  // ---------- Link de pagamento da nutri logada ----------
  if (!ehWebhook && body.acao === "link") {
    const auth = req.headers.get("Authorization") || "";
    const quem = createClient(URL_SB, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await quem.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return json({ error: "sem_login" }, 401);

    const ciclo = body.ciclo === "anual" || body.ciclo === "semestral" ? body.ciclo : "mensal";
    const { data: preco, error: ep } = await admin.rpc("nutriplat_preco", { p_user: uid, p_ciclo: ciclo });
    if (ep || !preco) return json({ error: "sem_preco", detail: ep?.message }, 500);

    try {
      const r = await fetch("https://api.infinitepay.io/invoices/public/checkout/links", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          handle: HANDLE,
          redirect_url: VOLTA,
          webhook_url: WEBHOOK,
          order_nsu: `nutriplat-${ciclo}~${uid}`,
          items: [{
            quantity: 1,
            price: preco,
            description: ciclo === "mensal" ? "NutriPlat — mensalidade" : `NutriPlat — plano ${ciclo}`,
          }],
        }),
      });
      const criado = await r.json().catch(() => ({}));
      const url = typeof criado?.url === "string" ? criado.url : "";
      if (!url) return json({ error: "sem_link", tecnico: JSON.stringify(criado).slice(0, 300) }, 502);
      return json({ ok: true, url, centavos: preco, ciclo });
    } catch (e) {
      return json({ error: "sem_link", tecnico: String(e).slice(0, 200) }, 502);
    }
  }

  // ---------- Confirmação (redirect ou webhook) ----------
  if (!ehWebhook && body.acao !== "confirmar") return json({ error: "acao_desconhecida" }, 400);

  const nsu = pick(body, ["transaction_nsu", "data.transaction_nsu"]);
  const order = pick(body, ["order_nsu", "external_order_nsu", "data.order_nsu"]) || "";
  const slug = pick(body, ["invoice_slug", "slug", "data.invoice_slug"]);
  const recibo = pick(body, ["receipt_url", "data.receipt_url"]);
  const alvo = partir(order);

  // Webhook responde sempre 200: erro nosso não pode virar reenvio em loop.
  const falha = (error: string, s: number) => json({ ok: false, error }, ehWebhook ? 200 : s);
  if (!nsu || !slug) return falha("faltam_dados_do_pagamento", 400);
  if (!alvo) return falha("pedido_nao_e_da_nutriplat", 400);

  let pago: { success?: boolean; paid?: boolean; paid_amount?: number } = {};
  try {
    const r = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: HANDLE, transaction_nsu: nsu, external_order_nsu: order, slug }),
    });
    pago = await r.json();
  } catch (e) {
    return falha("checagem_indisponivel", 503);
  }
  if (!pago.success || !pago.paid) return falha("pagamento_nao_confirmado", 402);

  const valor = Number(pago.paid_amount || 0);
  // O ciclo do pedido só vale se o valor sustenta: um link mensal editado
  // para "anual" não pode liberar 12 meses.
  const ciclo = alvo.ciclo === "anual" && valor >= 71900 * TOLERANCIA ? "anual"
    : alvo.ciclo === "semestral" && valor >= 41940 * TOLERANCIA ? "semestral" : "mensal";
  if (valor < 3995 * TOLERANCIA) return falha("valor_nao_reconhecido", 409);

  const { data, error } = await admin.rpc("registrar_pagamento_nutriplat", {
    p_user: alvo.user, p_nsu: nsu, p_order: order, p_slug: slug,
    p_valor: valor, p_ciclo: ciclo, p_recibo: recibo, p_payload: body,
  });
  if (error) return falha("falha_registro: " + error.message, 500);
  return json({ ...(data as Record<string, unknown>), ciclo });
});
