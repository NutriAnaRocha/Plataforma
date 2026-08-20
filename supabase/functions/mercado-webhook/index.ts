// ============================================================
//  mercado-webhook — a entrega do RotuLens deixa de depender do navegador
//
//  O QUE ESTAVA ERRADO
//    Os links de checkout tinham só redirect_url: o código de acesso só
//    nascia se a compradora VOLTASSE do checkout para o app. Quem paga
//    pelo navegador do Instagram volta para AQUELE navegador, e o app
//    instalado na tela inicial — que é onde ela vai usar — fica sem
//    código. Aconteceu com a própria Ana no primeiro pagamento real.
//
//  O QUE ESTA FUNCTION FAZ
//    1. Grava o POST cru da InfinitePay em mercado_pagamentos (e-mail do
//       comprador incluído: é a chave de recuperação do código).
//    2. Delega a entrega para quem já sabe entregar — mercado-assinatura
//       ou mercado-creditos. Elas conferem o pagamento server-to-server
//       no /payment_check e são idempotentes por transaction_nsu.
//    3. Guarda o código devolvido na linha do pagamento.
//
//  POR QUE DELEGAR EM VEZ DE CRIAR O CÓDIGO AQUI
//    Duplicar a regra (valor -> plano, renovação no mesmo código, corrida
//    de abas, tolerância do parcelado) daria duas verdades sobre dinheiro
//    em dois arquivos. Aqui e o redirect chamam A MESMA função: quem
//    chegar primeiro cria, o segundo recebe ja_resgatado. O webhook é o
//    caminho confiável; o redirect virou atalho para a tela já mostrar o
//    código na hora.
//
//  RENOVAÇÃO SEM O NAVEGADOR
//    Pelo redirect, quem já assina manda o código guardado no aparelho e
//    a compra vira renovação. O webhook não tem localStorage nenhum — o
//    que ele tem é o e-mail do checkout. Então o código anterior é
//    procurado pelo e-mail em mercado_pagamentos. Sem isso, uma renovação
//    feita pelo navegador do Instagram criaria um SEGUNDO código, e a
//    assinante ficaria com o acesso partido em dois.
//
//  RESPOSTA SEMPRE 200
//    A InfinitePay reenvia o webhook quando não recebe 200. Um erro nosso
//    virando 500 vira loop de reenvio; o resultado real de cada pagamento
//    fica no status da linha em mercado_pagamentos, que é onde se depura.
//
//  verify_jwt = false: quem chama é o servidor deles, sem JWT nenhum.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });

// order_nsu -> qual produto foi vendido. É fixo no link de checkout, então
// é o único campo do payload que não depende de a InfinitePay nomear igual.
// O valor pago continua decidindo o PLANO lá dentro (mensal/anual): aqui só
// se decide para qual função mandar.
const PRODUTO: Record<string, "assinatura" | "creditos"> = {
  "mercado-mensal": "assinatura",
  "mercado-anual": "assinatura",
  "mercado-50leituras": "creditos",
  // O app se chama RotuLens desde agosto; os order_nsu antigos nasceram com
  // o nome velho ("No mercado com a Nutri Ana") e continuam nos links que
  // já circulam por aí. Os dois nomes valem para sempre — um link antigo
  // salvo num print tem de entregar igual.
  "rotulens-mensal": "assinatura",
  "rotulens-anual": "assinatura",
  "rotulens-pacote50": "creditos",
};

/** Procura um valor em vários caminhos possíveis do payload.
 *  Defensivo de propósito: o formato do POST da InfinitePay não está
 *  documentado, e o payload cru fica gravado para conferir depois. */
function pick(obj: unknown, paths: string[]): string | null {
  for (const p of paths) {
    const val = p.split(".").reduce(
      (o: unknown, k) => (o == null ? o : (o as Record<string, unknown>)[k]),
      obj,
    );
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number") return String(val);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { payload = {}; }

  const nsu = pick(payload, [
    "transaction_nsu", "transactionNsu", "nsu", "data.transaction_nsu",
  ]);
  const orderNsu = pick(payload, [
    "order_nsu", "orderNsu", "external_order_nsu", "data.order_nsu",
  ]);
  const slug = pick(payload, [
    "invoice_slug", "slug", "invoiceSlug", "data.invoice_slug",
  ]);
  const email = pick(payload, [
    "customer.email", "email", "payer.email", "buyer.email", "client.email",
    "customer_email", "data.customer.email", "data.email",
  ]);
  const nome = pick(payload, [
    "customer.name", "name", "payer.name", "buyer.name", "customer_name",
    "data.customer.name",
  ]);
  const telefone = pick(payload, [
    "customer.phone", "phone", "payer.phone", "customer_phone",
    "data.customer.phone",
  ]);
  const pagoRaw = pick(payload, ["paid_amount", "amount", "data.paid_amount"]);
  const valor = pagoRaw ? parseInt(String(pagoRaw), 10) : null;
  const produto = orderNsu ? PRODUTO[orderNsu] ?? null : null;

  // Sem nsu não há pagamento identificável: guarda para a Ana ver e sai.
  // (Acontece se a InfinitePay mandar um ping de teste, por exemplo.)
  if (!nsu) {
    await admin.from("mercado_pagamentos").insert({
      transaction_nsu: "sem-nsu-" + crypto.randomUUID(),
      order_nsu: orderNsu, invoice_slug: slug, produto,
      email, nome, telefone, valor_centavos: valor,
      status: "erro", detalhe: "payload sem transaction_nsu", payload,
    });
    return json({ ok: true, sem_nsu: true });
  }

  // ---- 1) Registra o pagamento ----
  // insert + ignora conflito, em vez de upsert: o reenvio do MESMO nsu não
  // pode reescrever o e-mail da linha. É o que impede que um POST forjado
  // com o nsu de outra pessoa cole outro e-mail sobre a compra dela e
  // depois recupere o código por e-mail.
  const { error: errIns } = await admin.from("mercado_pagamentos").insert({
    transaction_nsu: nsu,
    order_nsu: orderNsu, invoice_slug: slug, produto,
    email, nome, telefone, valor_centavos: valor,
    status: "recebido", payload,
  });
  const jaExistia = !!errIns && errIns.code === "23505";
  if (errIns && !jaExistia) {
    return json({ ok: true, erro_registro: errIns.message });
  }

  const marcar = (status: string, detalhe?: string, codigo?: string) =>
    admin.from("mercado_pagamentos").update({
      status, detalhe: detalhe ?? null,
      ...(codigo ? { codigo } : {}),
      atualizado_em: new Date().toISOString(),
    }).eq("transaction_nsu", nsu);

  // Reenvio de um pagamento já entregue: nada a fazer.
  if (jaExistia) {
    const { data: linha } = await admin.from("mercado_pagamentos")
      .select("status,codigo").eq("transaction_nsu", nsu).maybeSingle();
    if (linha?.codigo) return json({ ok: true, ja_entregue: true });
  }

  if (!slug) {
    // Sem o invoice_slug o /payment_check não confirma nada. O redirect
    // ainda salva essa venda (ele traz o slug na URL), e a linha fica
    // marcada para a Ana enxergar o caso.
    await marcar("sem_slug", "payload sem invoice_slug: entrega depende do redirect");
    return json({ ok: true, sem_slug: true });
  }
  if (!produto) {
    await marcar("erro", "order_nsu sem produto mapeado: " + (orderNsu ?? "vazio"));
    return json({ ok: true, sem_produto: true });
  }

  // ---- 2) Renovação: acha o código anterior deste e-mail ----
  let codigoAntigo = "";
  if (produto === "assinatura" && email) {
    const { data: anterior } = await admin.from("mercado_pagamentos")
      .select("codigo")
      .eq("produto", "assinatura")
      .ilike("email", email)
      .not("codigo", "is", null)
      .neq("transaction_nsu", nsu)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    codigoAntigo = anterior?.codigo ?? "";
  }

  // ---- 3) Delega a entrega ----
  const alvo = produto === "assinatura" ? "mercado-assinatura" : "mercado-creditos";
  let resposta: Record<string, unknown> = {};
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${alvo}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON,
        "Authorization": `Bearer ${ANON}`,
      },
      body: JSON.stringify({
        acao: "resgatar",
        transaction_nsu: nsu,
        order_nsu: orderNsu ?? "",
        slug,
        ...(codigoAntigo ? { codigo: codigoAntigo } : {}),
      }),
    });
    resposta = await r.json().catch(() => ({}));
  } catch (e) {
    // InfinitePay fora do ar, ou a nossa function caindo: a linha fica
    // como 'confirmado' pendente e o redirect (ou a Ana) ainda entrega.
    await marcar("erro", "falha ao chamar " + alvo + ": " + String(e).slice(0, 300));
    return json({ ok: true, erro_entrega: true });
  }

  const codigo = typeof resposta?.codigo === "string" ? resposta.codigo : null;
  if (!codigo) {
    await marcar(
      "nao_confirmado",
      alvo + " não devolveu código: " + JSON.stringify(resposta).slice(0, 400),
    );
    return json({ ok: true, sem_codigo: true });
  }

  await marcar("entregue", resposta.ja_resgatado ? "já existia (redirect chegou antes)" : null, codigo);
  return json({ ok: true, entregue: true });
});
