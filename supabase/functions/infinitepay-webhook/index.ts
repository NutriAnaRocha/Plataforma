// ============================================================
//  Edge Function: infinitepay-webhook
//  Recebe a notificação de pagamento do InfinitePay (POST no
//  webhook_url do link de checkout) e LIBERA o e-book na biblioteca
//  automaticamente — sem a Ana precisar inserir acesso na mão.
//
//  Fluxo:
//   1. Registra o pagamento em public.compras (payload cru + idempotência
//      por transaction_nsu).
//   2. CONFIRMA o pagamento server-to-server via /payment_check (não confia
//      só no POST, que poderia ser forjado).
//   3. Acha/cria a conta do comprador pelo e-mail (cadastro público está
//      desligado — então o webhook é quem cria, estilo Kiwify) e dispara
//      o e-mail de acesso.
//   4. Insere o acesso em public.ebook_acessos (origem 'infinitepay').
//
//  Segurança: usa SERVICE_ROLE (secret do projeto). O handle fica no
//  secret INFINITEPAY_HANDLE. Sempre responde 200 para a InfinitePay não
//  reenviar em loop; o resultado real fica no status da linha em compras.
//
//  OBS: os nomes exatos dos campos do webhook do InfinitePay ainda serão
//  confirmados com 1 pagamento real (o payload cru é salvo em compras.payload).
//  A extração abaixo é defensiva: procura o e-mail/nome em vários caminhos.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const HANDLE = Deno.env.get("INFINITEPAY_HANDLE") || "analuisarocha";
// URL para onde o e-mail de convite/acesso leva o comprador (a biblioteca).
const BIBLIOTECA_URL =
  Deno.env.get("BIBLIOTECA_URL") ||
  "https://nutrianarocha.github.io/Plataforma/prototipo/biblioteca.html";

// order_nsu (fixo no link de checkout) -> slug do catálogo da biblioteca.
const ORDER_TO_SLUG: Record<string, string> = {
  "rotulos-ebook": "guia-rotulos",
  "tentante-ebook": "guia-tentante",
  "canetas-ebook": "guia-canetas",
};

// Procura um valor em vários caminhos possíveis do payload (defensivo).
function pick(obj: any, paths: string[]): string | null {
  for (const p of paths) {
    const val = p.split(".").reduce((o: any, k) => (o == null ? o : o[k]), obj);
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let payload: any = {};
  try { payload = await req.json(); } catch (_) { payload = {}; }

  // ---- Extrai campos (defensivo; nomes reais confirmados com pagamento real) ----
  const transaction_nsu = pick(payload, ["transaction_nsu", "transactionNsu", "nsu", "data.transaction_nsu"]);
  const order_nsu = pick(payload, ["order_nsu", "orderNsu", "external_order_nsu", "data.order_nsu"]);
  const invoice_slug = pick(payload, ["invoice_slug", "slug", "invoiceSlug", "data.invoice_slug"]);
  const email = pick(payload, [
    "customer.email", "email", "payer.email", "buyer.email", "client.email",
    "customer_email", "data.customer.email", "data.email",
  ]);
  const nome = pick(payload, [
    "customer.name", "name", "payer.name", "buyer.name", "customer_name", "data.customer.name",
  ]);
  const telefone = pick(payload, [
    "customer.phone", "phone", "payer.phone", "customer_phone", "data.customer.phone",
  ]);
  const paidRaw = pick(payload, ["paid_amount", "amount", "data.paid_amount"]);
  const valor_cents = paidRaw ? parseInt(String(paidRaw), 10) : null;
  const ebook_slug = order_nsu ? ORDER_TO_SLUG[order_nsu] ?? null : null;

  // ---- 1) Idempotência: já liberado? ----
  if (transaction_nsu) {
    const { data: existente } = await admin
      .from("compras").select("status").eq("transaction_nsu", transaction_nsu).maybeSingle();
    if (existente && existente.status === "liberado") {
      return json({ ok: true, ja_liberado: true });
    }
  }

  // ---- 2) Registra a compra (payload cru para depurar campos reais) ----
  const base = {
    transaction_nsu, order_nsu, invoice_slug, ebook_slug,
    email, nome, telefone, valor_cents,
    payload, status: "recebido", atualizado_em: new Date().toISOString(),
  };
  // upsert por transaction_nsu quando existir; senão insere.
  let compraId: string | null = null;
  if (transaction_nsu) {
    const { data } = await admin.from("compras")
      .upsert(base, { onConflict: "transaction_nsu" }).select("id").maybeSingle();
    compraId = data?.id ?? null;
  } else {
    const { data } = await admin.from("compras").insert(base).select("id").maybeSingle();
    compraId = data?.id ?? null;
  }
  const marcar = (status: string, detalhe?: string, extra: Record<string, unknown> = {}) =>
    compraId
      ? admin.from("compras").update({ status, detalhe, atualizado_em: new Date().toISOString(), ...extra }).eq("id", compraId)
      : Promise.resolve();

  // ---- 3) Confirma o pagamento server-to-server (não confia só no POST) ----
  let confirmado = false;
  try {
    const resp = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: HANDLE, order_nsu, transaction_nsu, slug: invoice_slug }),
    });
    const check = await resp.json().catch(() => ({}));
    confirmado = check?.paid === true || check?.success === true;
    if (!confirmado) {
      await marcar("nao_confirmado", "payment_check não confirmou: " + JSON.stringify(check).slice(0, 400));
      return json({ ok: true, confirmado: false });
    }
  } catch (e) {
    await marcar("erro", "falha no payment_check: " + String(e).slice(0, 300));
    return json({ ok: true, erro_verificacao: true });
  }
  await marcar("confirmado");

  // ---- 4) Precisa do slug e do e-mail para liberar ----
  if (!ebook_slug) {
    await marcar("erro", "order_nsu sem mapeamento de slug: " + order_nsu);
    return json({ ok: true, sem_slug: true });
  }
  if (!email) {
    // Pago e confirmado, mas sem e-mail no payload: a Ana vê e resolve.
    await marcar("pago_sem_email", "pagamento confirmado, mas sem e-mail no payload");
    return json({ ok: true, pago_sem_email: true });
  }

  // ---- 5) Acha ou cria a conta do comprador ----
  let userId: string | null = null;
  const { data: existId } = await admin.rpc("user_id_por_email", { p_email: email });
  if (existId) {
    userId = existId as unknown as string;
  } else {
    const { data: novo, error: errInvite } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { nome: nome ?? "" },
      redirectTo: BIBLIOTECA_URL,
    });
    if (errInvite || !novo?.user) {
      await marcar("erro", "falha ao criar/convidar usuário: " + (errInvite?.message ?? "sem user"));
      return json({ ok: true, erro_conta: true });
    }
    userId = novo.user.id;
  }

  // ---- 6) Libera o acesso (vitalício) ----
  const { error: errAcesso } = await admin.from("ebook_acessos").upsert(
    { user_id: userId, ebook_slug, tipo: "comprador", origem: "infinitepay", expira_em: null },
    { onConflict: "user_id,ebook_slug" },
  );
  if (errAcesso) {
    await marcar("erro", "falha ao inserir acesso: " + errAcesso.message, { user_id: userId });
    return json({ ok: true, erro_acesso: true });
  }

  await marcar("liberado", "acesso liberado automaticamente", { user_id: userId });
  return json({ ok: true, liberado: true, ebook_slug });
});
