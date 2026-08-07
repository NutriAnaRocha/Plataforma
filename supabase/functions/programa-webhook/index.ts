// ============================================================
//  Edge Function: programa-webhook
//  Recebe a notificação de pagamento do InfinitePay do programa
//  "Meu Plano com a Nutri Ana" e transforma a compra em PACIENTE:
//  conta de login + ficha clínica + assinatura vigente + e-books bônus.
//
//  Separada de propósito da infinitepay-webhook (e-books): aquela já
//  funciona e vende todo dia, não vale arriscar. A espinha é a mesma
//  (idempotência por transaction_nsu, registro em compras, confirmação
//  server-to-server via /payment_check, convite por e-mail); o que muda
//  é o que acontece depois do pagamento confirmado.
//
//  Fluxo:
//   1. Registra o pagamento em public.compras (payload cru + idempotência).
//   2. CONFIRMA via /payment_check — não confia no POST, que pode ser forjado.
//   3. Acha/cria a conta do comprador pelo e-mail, com tipo 'paciente'.
//   4. Cria a FICHA em public.pacientes na carteira da Ana, vinculada ao login.
//   5. Abre a assinatura em public.programa_assinaturas (vigência do período).
//   6. Libera os e-books inclusos como bônus (nunca como condicionamento —
//      venda casada é vedada pelo Art. 76 da Res. CFN 856/2026).
//
//  O que ela recebe NÃO é um plano pronto: é acesso ao portal para
//  preencher a anamnese. O plano só existe depois de a Ana avaliar.
//
//  Segurança: usa SERVICE_ROLE (secret do projeto). Sempre responde 200
//  para a InfinitePay não reenviar em loop; o resultado real fica no
//  status da linha em compras.
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

// Destino do e-mail de convite: a tela de login DO SITE, que é a única que
// parseia o hash #access_token&type=invite e deixa a pessoa criar a senha.
// De lá, conta.js reconhece tipo='paciente' e manda para o portal.
// O destino precisa estar na uri_allow_list do Auth.
const ENTRAR_URL =
  Deno.env.get("ENTRAR_URL") ||
  "https://nutrianaluisarocha.com/entrar";

// Ciclo de reavaliação, em dias. Ponto de partida apenas: na hora do
// pagamento a compra é a única data que existe. Quando a anamnese chega,
// salvar_anamnese_paciente reancora proxima_reavaliacao em anamnese +
// ciclo — que é quando o acompanhamento de fato começa.
//
// A verdade do ciclo mora no banco, em programa_ciclo_dias() (migração
// 0047). Este número é o espelho dela e é o ÚNICO fora do banco: mudar
// lá sem mudar aqui deixa a âncora provisória em desacordo por um ciclo.
const REAVALIACAO_DIAS = 30;

// order_nsu (fixo no link de checkout) -> plano do programa.
// 'ebooks' entram como bônus incluso; '*' libera a biblioteca inteira.
const PLANOS: Record<string, {
  plano: "trimestral" | "semestral" | "anual";
  meses: number;
  valor_cents: number;
  reavaliacao_dias: number;
  ebooks: string[];
}> = {
  "meuplano-trimestral": {
    plano: "trimestral", meses: 3, valor_cents: 22900,
    reavaliacao_dias: REAVALIACAO_DIAS, ebooks: ["guia-rotulos"],
  },
  "meuplano-semestral": {
    plano: "semestral", meses: 6, valor_cents: 32000,
    reavaliacao_dias: REAVALIACAO_DIAS, ebooks: ["guia-rotulos", "guia-canetas"],
  },
  "meuplano-anual": {
    plano: "anual", meses: 12, valor_cents: 45000,
    reavaliacao_dias: REAVALIACAO_DIAS, ebooks: ["*"],
  },
};

// Procura um valor em vários caminhos possíveis do payload (defensivo —
// os nomes reais dos campos do InfinitePay só se confirmam com um
// pagamento de verdade; o payload cru fica salvo em compras.payload).
function pick(obj: any, paths: string[]): string | null {
  for (const p of paths) {
    const val = p.split(".").reduce((o: any, k) => (o == null ? o : o[k]), obj);
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  const primeira = partes[0][0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function somarMeses(base: Date, meses: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

function somarDias(base: Date, dias: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
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

  // ---- Extrai campos ----
  const transaction_nsu = pick(payload, ["transaction_nsu", "transactionNsu", "nsu", "data.transaction_nsu"]);
  const order_nsu = pick(payload, ["order_nsu", "orderNsu", "external_order_nsu", "data.order_nsu"]);
  const invoice_slug = pick(payload, ["invoice_slug", "slug", "invoiceSlug", "data.invoice_slug"]);
  const email = pick(payload, [
    "customer.email", "email", "payer.email", "buyer.email", "client.email",
    "customer_email", "data.customer.email", "data.email",
  ])?.toLowerCase() ?? null;
  const nome = pick(payload, [
    "customer.name", "name", "payer.name", "buyer.name", "customer_name", "data.customer.name",
  ]);
  const telefone = pick(payload, [
    "customer.phone", "phone", "payer.phone", "customer_phone", "data.customer.phone",
  ]);
  const paidRaw = pick(payload, ["paid_amount", "amount", "data.paid_amount"]);
  const valor_cents = paidRaw ? parseInt(String(paidRaw), 10) : null;
  const cfg = order_nsu ? PLANOS[order_nsu] ?? null : null;

  // ---- 1) Idempotência: já liberado? ----
  if (transaction_nsu) {
    const { data: existente } = await admin
      .from("compras").select("status").eq("transaction_nsu", transaction_nsu).maybeSingle();
    if (existente && existente.status === "liberado") {
      return json({ ok: true, ja_liberado: true });
    }
  }

  // ---- 2) Registra a compra ----
  const base = {
    transaction_nsu, order_nsu, invoice_slug,
    ebook_slug: null,                 // este webhook não vende e-book avulso
    email, nome, telefone, valor_cents,
    payload, status: "recebido", atualizado_em: new Date().toISOString(),
  };
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

  if (!cfg) {
    await marcar("erro", "order_nsu sem plano correspondente: " + order_nsu);
    return json({ ok: true, sem_plano: true });
  }

  // ---- 3) Confirma o pagamento server-to-server ----
  try {
    const resp = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: HANDLE, order_nsu, transaction_nsu, slug: invoice_slug }),
    });
    const check = await resp.json().catch(() => ({}));
    const confirmado = check?.paid === true || check?.success === true;
    if (!confirmado) {
      await marcar("nao_confirmado", "payment_check não confirmou: " + JSON.stringify(check).slice(0, 400));
      return json({ ok: true, confirmado: false });
    }
  } catch (e) {
    await marcar("erro", "falha no payment_check: " + String(e).slice(0, 300));
    return json({ ok: true, erro_verificacao: true });
  }
  await marcar("confirmado");

  if (!email) {
    // Pago e confirmado, mas sem e-mail: a Ana vê na lista de compras e resolve.
    await marcar("pago_sem_email", "pagamento confirmado, mas sem e-mail no payload");
    return json({ ok: true, pago_sem_email: true });
  }

  // ---- 4) Nutricionista responsável (dona da carteira) ----
  let nutriId = Deno.env.get("NUTRI_ID") || "";
  if (!nutriId) {
    // Sem o secret configurado, cai na admin do sistema. Se nem isso existir,
    // não dá para criar a ficha — melhor falhar visível do que órfã.
    const { data: adminRow } = await admin
      .from("profiles").select("id").eq("is_admin", true).eq("tipo", "nutri").limit(1).maybeSingle();
    nutriId = adminRow?.id ?? "";
  }
  if (!nutriId) {
    await marcar("erro", "NUTRI_ID não configurado e nenhuma nutri admin encontrada");
    return json({ ok: true, sem_nutri: true });
  }

  // ---- 5) Acha ou cria a conta ----
  let userId: string | null = null;
  let contaNova = false;
  const { data: existId } = await admin.rpc("user_id_por_email", { p_email: email });
  if (existId) {
    userId = existId as unknown as string;
  } else {
    // tipo: "paciente" é essencial. Sem ele, handle_new_user faz
    // coalesce(..., 'nutri') e a compradora entraria no painel da Ana
    // em vez do portal dela (ver migração 0018).
    const { data: novo, error: errInvite } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { nome: nome ?? "", tipo: "paciente" },
      redirectTo: ENTRAR_URL,
    });
    if (errInvite || !novo?.user) {
      await marcar("erro", "falha ao criar/convidar usuário: " + (errInvite?.message ?? "sem user"));
      return json({ ok: true, erro_conta: true });
    }
    userId = novo.user.id;
    contaNova = true;
  }

  // Garante o papel mesmo se a conta já existia como 'comprador' (alguém que
  // já tinha comprado um e-book antes e agora entrou no programa).
  await admin.from("profiles").update({ tipo: "paciente" }).eq("id", userId).neq("tipo", "nutri");

  // ---- 6) Acha ou cria a FICHA clínica ----
  let pacienteId: string | null = null;
  const { data: fichaExistente } = await admin
    .from("pacientes").select("id").eq("user_id", userId).maybeSingle();

  if (fichaExistente) {
    pacienteId = fichaExistente.id;
  } else {
    const nomeFicha = nome || email.split("@")[0];
    const { data: ficha, error: errFicha } = await admin.from("pacientes").insert({
      nutricionista_id: nutriId,
      user_id: userId,
      nome: nomeFicha,
      ini: iniciais(nomeFicha),
      status: "ativo",
      objetivo: "Programa Meu Plano",
      contato: { email, tel: telefone ?? "" },
      tags: ["programa", cfg.plano],
    }).select("id").maybeSingle();
    if (errFicha || !ficha) {
      await marcar("erro", "falha ao criar ficha: " + (errFicha?.message ?? "sem retorno"), { user_id: userId });
      return json({ ok: true, erro_ficha: true });
    }
    pacienteId = ficha.id;
  }

  // ---- 7) Abre a assinatura (vigência do período comprado) ----
  const hoje = new Date();
  const { error: errAss } = await admin.from("programa_assinaturas").insert({
    user_id: userId,
    paciente_id: pacienteId,
    nutricionista_id: nutriId,
    plano: cfg.plano,
    status: "ativa",
    inicio: hoje.toISOString().slice(0, 10),
    fim: somarMeses(hoje, cfg.meses),
    proxima_reavaliacao: somarDias(hoje, cfg.reavaliacao_dias),
    valor_cents: valor_cents ?? cfg.valor_cents,
    compra_id: compraId,
  });
  if (errAss) {
    // O índice único em compra_id é a rede de segurança contra reenvio do
    // webhook: a segunda tentativa bate aqui em vez de criar ficha duplicada.
    if (/duplicate key|unique/i.test(errAss.message)) {
      await marcar("liberado", "reenvio do webhook — assinatura já existia", { user_id: userId });
      return json({ ok: true, ja_liberado: true });
    }
    await marcar("erro", "falha ao abrir assinatura: " + errAss.message, { user_id: userId });
    return json({ ok: true, erro_assinatura: true });
  }

  // ---- 8) E-books inclusos como bônus ----
  // Título nominal fica vitalício (ela ganhou o livro); o acesso total à
  // biblioteca ('*', plano anual) vale enquanto o programa vigorar.
  const expira = new Date(hoje);
  expira.setMonth(expira.getMonth() + cfg.meses);
  for (const slug of cfg.ebooks) {
    await admin.from("ebook_acessos").upsert(
      {
        user_id: userId, ebook_slug: slug,
        tipo: "assinante", origem: "programa",
        expira_em: slug === "*" ? expira.toISOString() : null,
      },
      { onConflict: "user_id,ebook_slug" },
    );
  }

  await marcar("liberado", "programa liberado automaticamente", { user_id: userId });
  return json({
    ok: true, liberado: true,
    plano: cfg.plano, paciente_id: pacienteId, conta_nova: contaNova,
  });
});
