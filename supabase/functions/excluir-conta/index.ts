// ============================================================
//  Edge Function: excluir-conta  (LGPD — direito à eliminação)
//  A nutri autenticada solicita a exclusão DEFINITIVA da própria conta.
//  Apaga o auth.user dela → cascata remove profile, pacientes, prontuários,
//  consultas, lançamentos, tokens Google e todo o conteúdo próprio (todas as
//  FKs referenciam auth.users com ON DELETE CASCADE). Também remove os
//  logins de portal dos pacientes dela (contas auth separadas).
//
//  Só apaga a conta do PRÓPRIO chamador (uid vem do JWT, nunca do corpo).
//  Exige confirmação explícita { confirmar: "EXCLUIR" }. verify_jwt=true.
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

  // 1) Exige usuário autenticado (o JWT define QUEM será apagado).
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const uid = userRes.user.id;

  // 2) Confirmação explícita anti-acidente.
  let body: { confirmar?: string };
  try { body = await req.json(); } catch { body = {}; }
  if ((body.confirmar || "").trim().toUpperCase() !== "EXCLUIR") {
    return json({ error: "confirmacao_invalida" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3) Coleta os logins de portal dos pacientes desta nutri (contas auth
  //    separadas que a cascata NÃO remove — pacientes.user_id é ON DELETE
  //    SET NULL). Guardamos antes de apagar a nutri.
  let portalUserIds: string[] = [];
  try {
    const { data: pacs } = await admin
      .from("pacientes")
      .select("user_id")
      .eq("nutricionista_id", uid);
    portalUserIds = (pacs || [])
      .map((p: { user_id: string | null }) => p.user_id)
      .filter((x): x is string => !!x);
  } catch { /* segue: apagar a nutri é o essencial */ }

  // 4) Apaga a conta da nutri → cascata remove todos os dados próprios dela.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: "falha_exclusao", detail: delErr.message }, 502);

  // 5) Best-effort: remove os logins de portal dos pacientes (os dados
  //    clínicos deles já foram embora na cascata da linha pacientes).
  let portalRemovidos = 0;
  for (const pid of portalUserIds) {
    try {
      const { error } = await admin.auth.admin.deleteUser(pid);
      if (!error) portalRemovidos++;
    } catch { /* ignora um a um */ }
  }

  return json({ ok: true, conta_removida: uid, portais_removidos: portalRemovidos });
});
