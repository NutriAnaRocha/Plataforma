// ============================================================
//  Edge Function: assinatura-webhook
//  PONTO DE CONEXÃO da cobrança recorrente do SaaS (assinatura da nutri).
//
//  Recebe a notificação do provedor de pagamento recorrente (a definir:
//  InfinitePay assinatura / Asaas / Pagar.me / Stripe) e:
//    1. registra o evento cru em public.assinatura_eventos (auditoria);
//    2. (recomendado) confirma o pagamento server-to-server no provedor;
//    3. garante a conta da nutri (cria como 'nutri' se ainda não existir);
//    4. chama a RPC ativar_assinatura / encerrar_assinatura (migração 0038).
//
//  Segurança: usa SERVICE_ROLE (secret do projeto). O segredo de verificação
//  do provedor deve ficar em ASSINATURA_WEBHOOK_SECRET. Responde sempre 200
//  para o provedor não reenviar em loop; o resultado real fica na linha do evento.
//
//  ⚠️ Este é o ESQUELETO. Os nomes exatos dos campos e a checagem de
//  assinatura HMAC dependem do provedor escolhido — ajustar em pick()/verify().
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// Onde o convite/criação da conta leva a nova nutri (criar senha). Precisa
// estar na uri_allow_list do Auth.
const LOGIN_URL =
  Deno.env.get("PLATAFORMA_LOGIN_URL") ||
  "https://app.nutrianaluisarocha.com/index.html";

function pick(obj: any, paths: string[]): string | null {
  for (const p of paths) {
    const v = p.split(".").reduce((o: any, k) => (o == null ? o : o[k]), obj);
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let payload: any = {};
  try { payload = await req.json(); } catch (_) { payload = {}; }

  // ---- Extrai campos (defensivo; ajustar aos nomes do provedor real) ----
  const email = pick(payload, [
    "customer.email", "email", "payer.email", "subscriber.email", "data.customer.email", "data.email",
  ]);
  const nome = pick(payload, ["customer.name", "name", "payer.name", "data.customer.name"]);
  const evento = (pick(payload, ["event", "type", "status", "data.status"]) || "").toLowerCase();
  const ref = pick(payload, ["subscription_id", "id", "transaction_nsu", "data.id"]);
  const provider = pick(payload, ["provider"]) || "recorrente";

  // Classifica o evento: pago/renovado → ativa; falha/cancelado → encerra.
  const ativa = /paid|active|approved|renew|success|confirmed|ativ|pago|aprovad/.test(evento);
  const encerra = /cancel|fail|refus|expired|overdue|inadimpl|venc|reembols|refund/.test(evento);

  // ---- 1) Auditoria (tabela criada sob demanda; se não existir, ignora) ----
  await admin.from("assinatura_eventos").insert({
    email, nome, evento, ref, provider, payload,
  }).then(() => {}, () => {}); // silencioso se a tabela ainda não existir

  if (!email) return json({ ok: true, sem_email: true });

  // ---- 2) TODO: confirmar o pagamento server-to-server no provedor ----
  //     (não confiar apenas no POST; verificar HMAC/consulta à API do provedor).

  // ---- 3) Garante a conta da nutri (self-serve pago sem convite prévio) ----
  let userId: string | null = null;
  const { data: existId } = await admin.rpc("user_id_por_email", { p_email: email });
  if (existId) {
    userId = existId as unknown as string;
  } else if (ativa) {
    const { data: novo } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { nome: nome ?? "", tipo: "nutri" },
      redirectTo: LOGIN_URL,
    });
    userId = novo?.user?.id ?? null;
  }

  // ---- 4) Aplica o efeito na assinatura ----
  if (ativa) {
    await admin.rpc("ativar_assinatura", { p_email: email, p_meses: 1, p_provider: provider, p_ref: ref });
    return json({ ok: true, acao: "ativada", email });
  }
  if (encerra) {
    await admin.rpc("encerrar_assinatura", { p_email: email, p_status: /cancel/.test(evento) ? "cancelada" : "vencida" });
    return json({ ok: true, acao: "encerrada", email });
  }
  return json({ ok: true, acao: "ignorado", evento });
});
