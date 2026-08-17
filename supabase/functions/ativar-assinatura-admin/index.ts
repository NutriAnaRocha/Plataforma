// ============================================================
//  Edge Function: ativar-assinatura-admin
//  A administradora (Ana) ativa/renova manualmente a assinatura de uma
//  nutricionista pelo e-mail — útil quando alguém paga pelo link do
//  InfinitePay e a liberação automática (webhook) ainda não está ligada.
//
//  Segurança: só quem tem profiles.is_admin = true. As RPCs de billing
//  são travadas para authenticated (migração 0041); aqui usamos o
//  service_role para chamar ativar_assinatura / encerrar_assinatura.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1) Identifica o chamador.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const callerId = userRes.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2) O chamador é admin? (checado com service_role, sem depender de RLS)
  const { data: perfil, error: perfilErr } = await admin
    .from("profiles").select("is_admin").eq("id", callerId).maybeSingle();
  if (perfilErr) return json({ error: "erro_perfil" }, 500);
  if (!perfil || perfil.is_admin !== true) return json({ error: "nao_autorizado" }, 403);

  // 3) Corpo.
  let body: { email?: string; meses?: number; acao?: string };
  try { body = await req.json(); } catch { return json({ error: "invalid_body" }, 400); }
  const acao = body.acao === "encerrar" || body.acao === "pausar" ? "encerrar"
    : body.acao === "listar" ? "listar" : "ativar";

  // 3.1) "listar": devolve o estado real da assinatura de cada nutri, que a
  //      nutri_convites não sabe (status ali é só o do convite). A Ana não
  //      enxerga o profiles das outras por RLS — por isso passa por aqui.
  if (acao === "listar") {
    const { data, error } = await admin
      .from("profiles")
      .select("email,nome,is_admin,assinatura_status,assinatura_expira_em,trial_expira_em")
      .or("tipo.is.null,tipo.neq.paciente");
    if (error) return json({ error: "erro_listar", detail: error.message }, 500);
    return json({ ok: true, nutris: data || [] });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "email_invalido" }, 400);

  // 4) Confere que existe uma nutri com esse e-mail.
  const { data: alvo, error: alvoErr } = await admin
    .from("profiles").select("id,tipo,email").ilike("email", email).maybeSingle();
  if (alvoErr) return json({ error: "erro_busca" }, 500);
  if (!alvo) return json({ error: "conta_nao_encontrada" }, 404);
  if (alvo.tipo === "paciente") return json({ error: "conta_e_paciente" }, 400);

  // 5) Executa via RPC (service_role).
  if (acao === "encerrar") {
    // Trancar a própria administradora fora da plataforma seria irreversível
    // pela interface — o painel Admin some junto com o acesso.
    if (alvo.id === callerId) return json({ error: "nao_pause_a_si" }, 400);
    const { error } = await admin.rpc("encerrar_assinatura", { p_email: email, p_status: "cancelada" });
    if (error) return json({ error: "falha_encerrar", detail: error.message }, 500);
    return json({ ok: true, email, acao: "encerrada" });
  }

  const meses = Math.min(60, Math.max(1, Math.round(Number(body.meses) || 1)));
  const { error } = await admin.rpc("ativar_assinatura", {
    p_email: email, p_meses: meses, p_provider: "manual", p_ref: "admin:" + callerId,
  });
  if (error) return json({ error: "falha_ativar", detail: error.message }, 500);

  // Lê a validade resultante p/ devolver ao painel.
  const { data: pf } = await admin
    .from("profiles").select("assinatura_status,assinatura_expira_em").eq("id", alvo.id).maybeSingle();
  return json({
    ok: true, email, acao: "ativada", meses,
    status: pf?.assinatura_status, expira_em: pf?.assinatura_expira_em,
  });
});
