// ============================================================
//  mercado-assinatura — quem paga, o que recebe e por quanto tempo
//
//    { acao: "resgatar", transaction_nsu, order_nsu, slug, codigo? }
//        -> pergunta ao InfinitePay se AQUELE pagamento existe mesmo e
//           foi pago, e só então cria (ou renova) a assinatura.
//           'codigo' opcional = renovação de quem já é assinante:
//           ela continua com o mesmo código, com mais meses.
//
//    { acao: "acesso", codigo }
//        -> responde por assinatura E por pacote de leituras antigo,
//           porque o app tem um campo de código só e a pessoa não
//           deveria precisar saber qual dos dois ela comprou.
//
//    { acao: "recuperar", email, dispositivo }
//        -> devolve o código da compra feita com aquele e-mail. É o
//           socorro de quem pagou e não recebeu (ou perdeu) o código:
//           sem login, o e-mail do checkout é a única coisa que a
//           compradora consegue repetir. As tentativas são contadas por
//           aparelho na própria função do banco (migration 0073), senão
//           o formulário viraria um oráculo para varrer e-mails.
//
//  MESMA DESCONFIANÇA DA mercado-creditos
//    Os campos do pagamento chegam pela query string do navegador de
//    alguém. Qualquer um pode inventar um transaction_nsu e pedir um
//    ano de assinatura. Por isso NADA é criado antes do payment_check
//    responder paid:true, e o valor pago decide o plano — não o que o
//    cliente diz ter comprado.
//
//  POR QUE NÃO É RECORRÊNCIA AUTOMÁTICA
//    A API de checkout do InfinitePay cria link avulso; assinatura com
//    cobrança recorrente só existe pelo painel deles, e o fluxo de
//    plano não devolve webhook confirmado. Entre uma renovação
//    automática que pode falhar em silêncio e um acesso pré-pago que
//    vence numa data que a pessoa vê na tela, o segundo é honesto e
//    funciona hoje. Quando houver uma assinatura de teste real para ler
//    o payload da recorrência, isto aqui vira o webhook dela.
//
//  verify_jwt = false: quem compra não tem conta no sistema.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const HANDLE = "analuisarocha";

// O valor pago manda. Comparar por FAIXA, e não por igualdade, porque a
// InfinitePay repassa o juros do parcelado ao comprador: quem paga em
// 3x manda mais centavos que o preço de tabela, e recusar isso seria
// negar a entrega de quem pagou a mais.
// O 2990 é o preço ANTIGO do anual (até 16/08/2026). Ele fica na lista de
// propósito: quem pagou por aquele link e ainda não resgatou o código não
// pode ficar sem a entrega por causa de uma tabela de preço que mudou.
const PLANOS = [
  { centavos: 1199, meses: 1,  plano: "mensal", nome: "1 mês" },
  { centavos: 2990, meses: 12, plano: "anual",  nome: "12 meses" },
  { centavos: 5990, meses: 12, plano: "anual",  nome: "12 meses" },
];
const TOLERANCIA_MENOR = 0.95;

function planoDoValor(pago: number) {
  let escolhido = null;
  for (const p of PLANOS) {
    if (pago >= Math.floor(p.centavos * TOLERANCIA_MENOR)) {
      if (!escolhido || p.centavos > escolhido.centavos) escolhido = p;
    }
  }
  return escolhido;
}

/* Código que a pessoa lê de uma tela e digita em outra, às vezes
   copiando de um print. Sem 0/O, 1/I/L e 5/S — os pares que fazem
   alguém digitar errado e achar que foi roubada. Mesmo alfabeto dos
   créditos, de propósito: os dois códigos convivem no mesmo campo. */
const ALFABETO = "ABCDEFGHJKMNPQRTUVWXYZ2346789";

function novoCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let s = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) s += "-";
    s += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    acao?: string; transaction_nsu?: string; order_nsu?: string;
    slug?: string; codigo?: string; email?: string; dispositivo?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "json_invalido" }, 400);
  }

  // ---------- Consulta de acesso (assinatura OU pacote) ----------
  if (body.acao === "acesso") {
    const codigo = String(body.codigo || "").trim().toUpperCase();
    if (!codigo) return json({ error: "codigo_ausente" }, 400);
    const { data } = await admin.rpc("mercado_acesso", { p_codigo: codigo });
    return json(data ?? { ok: false, motivo: "inexistente" });
  }

  // ---------- Socorro: o código pelo e-mail da compra ----------
  // Só o servidor pergunta ao banco. A trava (5 tentativas por aparelho
  // por dia) mora na função do banco, junto com o registro da tentativa —
  // se fosse aqui, uma rajada de chamadas simultâneas passaria inteira
  // antes de a primeira linha ser gravada.
  if (body.acao === "recuperar") {
    const email = String(body.email || "").trim().toLowerCase();
    const dispositivo = String(body.dispositivo || "").trim();
    if (!email || !dispositivo) return json({ error: "faltam_dados" }, 400);

    const { data, error } = await admin.rpc("mercado_recuperar_codigo", {
      p_email: email,
      p_dispositivo: dispositivo,
    });
    if (error) {
      return json({
        error: "falha_na_busca",
        detail: "Não consegui procurar agora. Tente de novo em alguns minutos — " +
                "e, se preferir, fale com a Ana pelo WhatsApp. 🌸",
      }, 503);
    }

    const r = (data ?? {}) as Record<string, unknown>;
    if (r.ok === true) return json(r);

    // As três respostas negativas dizem coisas diferentes para quem lê a
    // tela, e nenhuma delas confirma se o e-mail existe ou não em outra
    // compra — quem errou o e-mail vê a mesma frase de quem chutou.
    if (r.motivo === "muitas_tentativas") {
      return json({
        error: "muitas_tentativas",
        detail: "Você já tentou várias vezes hoje. Para não deixar ninguém " +
                "adivinhando código dos outros, esse formulário descansa até " +
                "amanhã — mas a Ana resolve na hora pelo WhatsApp. 🌸",
      }, 429);
    }
    if (r.motivo === "email_invalido") {
      return json({
        error: "email_invalido",
        detail: "Confira o e-mail: ele precisa ser o mesmo que você usou no pagamento.",
      }, 400);
    }
    return json({
      error: "nao_encontrado",
      detail: "Não achei nenhuma compra com esse e-mail. Ele precisa ser o mesmo " +
              "que você digitou no checkout — se foi outro, ou se a compra foi " +
              "antes de agosto, mande o comprovante para a Ana que ela acha. 🌸",
    }, 404);
  }

  // ---------- Resgate ----------
  if (body.acao !== "resgatar") return json({ error: "acao_desconhecida" }, 400);

  const nsu = String(body.transaction_nsu || "").trim();
  const slug = String(body.slug || "").trim();
  const orderNsu = String(body.order_nsu || "").trim();
  const codigoAntigo = String(body.codigo || "").trim().toUpperCase();
  if (!nsu || !slug) return json({ error: "faltam_dados_do_pagamento" }, 400);

  // Já resgatado? Devolve o MESMO acesso em vez de somar outro período.
  // É o caminho normal de quem recarrega a página de obrigado — e o que
  // impede que um F5 vire um ano de brinde.
  const { data: existente } = await admin
    .from("mercado_assinaturas")
    .select("codigo,plano,expira_em")
    .eq("transaction_nsu", nsu)
    .maybeSingle();
  if (existente) {
    return json({ ok: true, ja_resgatado: true, ...existente });
  }
  const { data: jaRenovou } = await admin
    .from("mercado_assinatura_pagamentos")
    .select("codigo")
    .eq("transaction_nsu", nsu)
    .maybeSingle();
  if (jaRenovou) {
    const { data: a } = await admin
      .from("mercado_assinaturas")
      .select("codigo,plano,expira_em")
      .eq("codigo", jaRenovou.codigo)
      .maybeSingle();
    return json({ ok: true, ja_resgatado: true, ...(a ?? {}) });
  }

  // ---------- A conferência ----------
  let pago: { paid?: boolean; paid_amount?: number; success?: boolean } = {};
  try {
    const r = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: HANDLE,
        transaction_nsu: nsu,
        external_order_nsu: orderNsu,
        slug,
      }),
    });
    pago = await r.json();
  } catch (e) {
    // InfinitePay fora do ar não pode virar "seu pagamento não existe":
    // ela pagou. Nada foi gravado, então o resgate continua possível.
    return json({
      error: "checagem_indisponivel",
      detail: "Não consegui confirmar o pagamento agora. Tente de novo em alguns " +
              "minutos — seu pagamento está seguro e o link continua valendo. 🌸",
      tecnico: String(e),
    }, 503);
  }

  if (!pago.success || !pago.paid) {
    return json({
      error: "pagamento_nao_confirmado",
      detail: "Esse pagamento não aparece como pago. Se você acabou de pagar, " +
              "espere um minutinho e recarregue esta página. 🌸",
    }, 402);
  }

  const plano = planoDoValor(Number(pago.paid_amount || 0));
  if (!plano) {
    return json({
      error: "valor_nao_reconhecido",
      detail: "O pagamento foi confirmado, mas o valor não bate com nenhum plano. " +
              "Fale com a Ana que ela resolve na mão. 🌸",
    }, 409);
  }

  // ---------- Renovação: mesmo código, mais meses ----------
  if (/^[A-Z0-9-]{6,16}$/.test(codigoAntigo)) {
    const { data: ren } = await admin.rpc("mercado_assinatura_renovar", {
      p_codigo: codigoAntigo,
      p_meses: plano.meses,
      p_nsu: nsu,
      p_order: orderNsu || null,
      p_valor: Number(pago.paid_amount || 0),
      p_plano: plano.plano,
    });
    if (ren?.ok) return json({ ...ren, renovada: true });
    // Código não existe (ela digitou errado ou é de pacote de leituras):
    // não é motivo para recusar o pagamento — cria uma assinatura nova.
  }

  // ---------- Assinatura nova ----------
  const expira = new Date();
  expira.setMonth(expira.getMonth() + plano.meses);

  let criado = null;
  for (let i = 0; i < 3 && !criado; i++) {
    const { data, error } = await admin
      .from("mercado_assinaturas")
      .insert({
        codigo: novoCodigo(),
        transaction_nsu: nsu,
        order_nsu: orderNsu || null,
        valor_centavos: Number(pago.paid_amount || 0),
        plano: plano.plano,
        expira_em: expira.toISOString(),
      })
      .select("codigo,plano,expira_em")
      .single();

    if (!error) { criado = data; break; }

    // Corrida: outra aba resgatou o mesmo pagamento no mesmo instante.
    if (error.code === "23505" && /transaction_nsu/.test(error.message || "")) {
      const { data: outro } = await admin
        .from("mercado_assinaturas")
        .select("codigo,plano,expira_em")
        .eq("transaction_nsu", nsu)
        .maybeSingle();
      if (outro) return json({ ok: true, ja_resgatado: true, ...outro });
    }
  }

  if (!criado) {
    return json({
      error: "falha_ao_criar",
      detail: "Seu pagamento foi confirmado, mas não consegui gerar o código agora. " +
              "Guarde o comprovante e fale com a Ana — ela libera na mão. 🌸",
    }, 500);
  }

  return json({ ok: true, ...criado, plano_nome: plano.nome });
});
