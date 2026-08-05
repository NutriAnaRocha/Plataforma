// ============================================================
//  mercado-creditos — resgate e consulta do pacote de leituras
//
//  O app "No mercado com a Nutri Ana" é grátis com limite diário.
//  Quem quer mais compra um pacote de leituras pelo InfinitePay.
//  Esta função faz duas coisas, e nenhuma delas confia no cliente:
//
//    { acao: "resgatar", transaction_nsu, order_nsu, slug }
//        -> pergunta ao InfinitePay se AQUELE pagamento existe mesmo e
//           foi pago, e só então cria o pacote. Devolve o código.
//
//    { acao: "saldo", codigo }
//        -> quantas leituras restam.
//
//  POR QUE NÃO TEM WEBHOOK
//    A API de link do InfinitePay aceita webhook_url, mas depender só
//    dele significa que uma entrega falha em silêncio se o webhook cair.
//    Aqui é o contrário: quem chega com o pagamento na mão é a própria
//    compradora, redirecionada com os campos na URL, e a função confere
//    na fonte. Sem webhook não há entrega perdida — no pior caso ela
//    reabre o link do recibo e resgata de novo (é idempotente).
//
//  A CONFERÊNCIA É O PRODUTO INTEIRO
//    Os campos vêm da query string, ou seja, do navegador de alguém.
//    Qualquer um pode inventar um transaction_nsu e pedir 50 leituras
//    de graça. É por isso que NADA é criado antes do payment_check
//    responder paid:true — e que o valor pago é conferido contra o
//    preço da tabela antes de creditar.
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
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const HANDLE = "analuisarocha";

// Tabela de preços. O valor pago manda: se um dia o pacote mudar de
// preço, o pagamento antigo continua valendo pelo que era na época.
// Comparar por FAIXA (e não por igualdade) porque a InfinitePay
// repassa o juros do parcelado ao comprador — quem paga em 3x manda
// mais centavos do que o preço de tabela, e recusar isso seria negar
// a entrega de quem pagou a mais.
const PACOTES = [
  { centavos: 990, creditos: 50, nome: "50 leituras" },
];
const TOLERANCIA_MENOR = 0.95;   // aceita até 5% a menos (arredondamento)

function pacoteDoValor(pago: number) {
  let escolhido = null;
  for (const p of PACOTES) {
    if (pago >= Math.floor(p.centavos * TOLERANCIA_MENOR)) {
      if (!escolhido || p.centavos > escolhido.centavos) escolhido = p;
    }
  }
  return escolhido;
}

/* Código que a pessoa vai LER de uma tela e DIGITAR em outra, talvez
   copiando à mão de um print. Sem 0/O, 1/I/L e 5/S: são os pares que
   fazem alguém digitar errado e achar que foi roubada. */
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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE);

  let body: {
    acao?: string;
    transaction_nsu?: string;
    order_nsu?: string;
    slug?: string;
    codigo?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "json_invalido" }, 400);
  }

  // ---------- Consulta de saldo ----------
  if (body.acao === "saldo") {
    const codigo = String(body.codigo || "").trim().toUpperCase();
    if (!codigo) return json({ error: "codigo_ausente" }, 400);
    const { data } = await admin.rpc("mercado_saldo", { p_codigo: codigo });
    return json(data ?? { ok: false, motivo: "inexistente" });
  }

  // ---------- Resgate ----------
  if (body.acao !== "resgatar") return json({ error: "acao_desconhecida" }, 400);

  const nsu = String(body.transaction_nsu || "").trim();
  const slug = String(body.slug || "").trim();
  const orderNsu = String(body.order_nsu || "").trim();
  if (!nsu || !slug) return json({ error: "faltam_dados_do_pagamento" }, 400);

  // Já resgatado? Devolve o MESMO código em vez de criar outro pacote.
  // É o caminho normal de quem recarrega a página de obrigado.
  const { data: existente } = await admin
    .from("mercado_creditos")
    .select("codigo,creditos_total,creditos_usados")
    .eq("transaction_nsu", nsu)
    .maybeSingle();
  if (existente) {
    return json({
      ok: true,
      ja_resgatado: true,
      codigo: existente.codigo,
      creditos: existente.creditos_total,
      restam: existente.creditos_total - existente.creditos_usados,
    });
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
    // A InfinitePay fora do ar não pode virar "seu pagamento não existe":
    // ela pagou. Peça para tentar de novo, e o resgate continua possível
    // depois porque nada foi gravado.
    return json({
      error: "checagem_indisponivel",
      detail: "Não consegui confirmar o pagamento agora. Tente de novo em alguns minutos — " +
              "seu pagamento está seguro e o link continua valendo. 🌸",
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

  const pacote = pacoteDoValor(Number(pago.paid_amount || 0));
  if (!pacote) {
    return json({
      error: "valor_nao_reconhecido",
      detail: "O pagamento foi confirmado, mas o valor não bate com nenhum pacote. " +
              "Fale com a Ana que ela resolve na mão. 🌸",
    }, 409);
  }

  // ---------- Cria o pacote ----------
  // Colisão de código é improvável (29^8), mas não impossível, e o
  // primary key recusaria a segunda. Três tentativas e desiste.
  let criado = null;
  for (let i = 0; i < 3 && !criado; i++) {
    const { data, error } = await admin
      .from("mercado_creditos")
      .insert({
        codigo: novoCodigo(),
        transaction_nsu: nsu,
        order_nsu: orderNsu || null,
        valor_centavos: Number(pago.paid_amount || 0),
        creditos_total: pacote.creditos,
      })
      .select("codigo,creditos_total")
      .single();

    if (!error) { criado = data; break; }

    // Corrida: outra aba resgatou o mesmo pagamento no mesmo instante.
    // O UNIQUE de transaction_nsu segurou — devolve o que ela criou.
    if (error.code === "23505" && /transaction_nsu/.test(error.message || "")) {
      const { data: outro } = await admin
        .from("mercado_creditos")
        .select("codigo,creditos_total,creditos_usados")
        .eq("transaction_nsu", nsu)
        .maybeSingle();
      if (outro) {
        return json({
          ok: true,
          ja_resgatado: true,
          codigo: outro.codigo,
          creditos: outro.creditos_total,
          restam: outro.creditos_total - outro.creditos_usados,
        });
      }
    }
  }

  if (!criado) {
    return json({
      error: "falha_ao_criar",
      detail: "Seu pagamento foi confirmado, mas não consegui gerar o código agora. " +
              "Guarde o comprovante e fale com a Ana — ela libera na mão. 🌸",
    }, 500);
  }

  return json({
    ok: true,
    codigo: criado.codigo,
    creditos: criado.creditos_total,
    restam: criado.creditos_total,
  });
});
