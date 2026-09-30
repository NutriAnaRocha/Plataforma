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
//    1. Grava o POST cru da InfinitePay em mercado_pagamentos, com o
//       receipt_url em coluna própria: é a chave de recuperação do
//       código (o payload real não traz e-mail nenhum — ver abaixo).
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
//  O QUE O PAYLOAD REAL TEM (pagamento de teste, 20/08/2026)
//    items, amount, order_nsu, paid_amount, receipt_url, installments,
//    invoice_slug, capture_method, transaction_nsu. E SÓ. Não vem
//    e-mail, nem nome, nem telefone: o webhook não sabe quem pagou.
//    Os campos de identidade continuam sendo lidos aqui porque não
//    custam nada e um dia podem aparecer, mas nada depende deles.
//
//  RENOVAÇÃO SEM O NAVEGADOR
//    Pelo redirect, quem já assina manda o código guardado no aparelho e
//    a compra vira renovação. O webhook não tem localStorage nenhum, e
//    também não tem e-mail. O único campo que é NOSSO no payload é o
//    order_nsu — ele vem fixo do link de checkout. Então a tela de
//    renovação cria um link com o código dentro do order_nsu
//    ("rotulens-anual~8K2Q-AJU4", mercado-assinatura/renovar_link) e é
//    daí que sai o código anterior. Sem isso, uma renovação feita pelo
//    navegador do Instagram criaria um SEGUNDO código, e a assinante
//    ficaria com o acesso partido em dois.
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

// "rotulens-anual~8K2Q-AJU4" -> { base: "rotulens-anual", codigo: "8K2Q-AJU4" }
// O que vem depois do til é o código de quem está renovando, colado no
// link por mercado-assinatura/renovar_link. Link sem til é compra nova.
function partirOrderNsu(orderNsu: string | null) {
  if (!orderNsu) return { base: null as string | null, codigo: "" };
  const i = orderNsu.indexOf("~");
  if (i < 0) return { base: orderNsu, codigo: "" };
  const codigo = orderNsu.slice(i + 1).trim().toUpperCase();
  return {
    base: orderNsu.slice(0, i),
    codigo: /^[A-Z0-9-]{6,16}$/.test(codigo) ? codigo : "",
  };
}

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
  const recibo = pick(payload, [
    "receipt_url", "receiptUrl", "data.receipt_url",
  ]);
  const pagoRaw = pick(payload, ["paid_amount", "amount", "data.paid_amount"]);
  const valor = pagoRaw ? parseInt(String(pagoRaw), 10) : null;
  const { base: orderBase, codigo: codigoDoLink } = partirOrderNsu(orderNsu);
  const produto = orderBase ? PRODUTO[orderBase] ?? null : null;

  // Sem nsu não há pagamento identificável: guarda para a Ana ver e sai.
  // (Acontece se a InfinitePay mandar um ping de teste, por exemplo.)
  if (!nsu) {
    await admin.from("mercado_pagamentos").insert({
      transaction_nsu: "sem-nsu-" + crypto.randomUUID(),
      order_nsu: orderNsu, invoice_slug: slug, produto,
      email, nome, telefone, valor_centavos: valor, receipt_url: recibo,
      status: "erro", detalhe: "payload sem transaction_nsu", payload,
    });
    return json({ ok: true, sem_nsu: true });
  }

  // ---- 1) Registra o pagamento ----
  // insert + ignora conflito, em vez de upsert: o reenvio do MESMO nsu
  // não pode reescrever a linha. É o que impede que um POST forjado com o
  // nsu de outra pessoa cole outros dados sobre a compra dela.
  const { error: errIns } = await admin.from("mercado_pagamentos").insert({
    transaction_nsu: nsu,
    order_nsu: orderNsu, invoice_slug: slug, produto,
    email, nome, telefone, valor_centavos: valor, receipt_url: recibo,
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

  // ---- 2) Renovação: o código anterior vem no próprio order_nsu ----
  // Quem clicou em "Renovar" na tela pagou por um link criado na hora,
  // com o código dela no order_nsu. Confere que o código existe mesmo
  // antes de mandar adiante: order_nsu vem do link, e link é URL que
  // qualquer um pode montar — um código inventado aqui faria a
  // mercado-assinatura tentar renovar assinatura de ninguém.
  let codigoAntigo = "";
  if (produto === "assinatura" && codigoDoLink) {
    const { data: ass } = await admin.from("mercado_assinaturas")
      .select("codigo").eq("codigo", codigoDoLink).maybeSingle();
    codigoAntigo = ass?.codigo ?? "";
  }
  // Segunda porta: as compras que a Ana lançou à mão têm e-mail. Se um
  // dia o payload deles passar a trazer e-mail, isto volta a valer
  // sozinho — hoje não casa nunca, e é de propósito que não casa.
  if (produto === "assinatura" && !codigoAntigo && email) {
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
