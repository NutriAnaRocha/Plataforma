// ============================================================
//  Edge Function: create-nutri-access
//  Um ADMIN (a Ana) cria o LOGIN de OUTRA nutricionista — modelo por
//  convite (24/07/2026). O cadastro público segue fechado; contas de
//  nutri nascem só por aqui (ou, no futuro, pelo webhook de assinatura).
//
//  Espelha create-patient-access:
//   - service_role p/ admin.createUser({ email_confirm:true }) — conta já
//     confirmada, sem depender de SMTP;
//   - metadata tipo:'nutri' → o trigger handle_new_user cria o profile
//     como nutri, e o auth-guard deixa entrar no painel.
//
//  A nova nutri NÃO herda dados da Ana (RLS por auth.uid()), mas já vê a
//  Inteligência Clínica base (nutricionista_id IS NULL). Carteira vazia,
//  biblioteca cheia.
//
//  Segurança: SÓ quem tem profiles.is_admin = true pode chamar. A senha
//  gerada volta no corpo p/ a Ana repassar; a nutri troca depois em
//  "Esqueci minha senha" ou em Configurações.
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

// Senha legível (sem caracteres ambíguos) quando o admin não define uma.
function gerarSenha(): string {
  const abc = "abcdefghjkmnpqrstuvwxyz";
  const NUM = "23456789";
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
  return cap(pick(abc, 4)) + pick(NUM, 3) + pick(abc, 3);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1) Identifica o chamador pelo JWT do Authorization.
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

  // 2) O chamador é admin? (checado com service_role p/ não depender de RLS)
  const { data: perfil, error: perfilErr } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", callerId)
    .maybeSingle();
  if (perfilErr) return json({ error: "erro_perfil" }, 500);
  if (!perfil || perfil.is_admin !== true) return json({ error: "nao_autorizado" }, 403);

  // 3) Corpo.
  let body: { email?: string; nome?: string; senha?: string; observacao?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const email = (body.email || "").trim().toLowerCase();
  const nome = (body.nome || "").trim();
  if (!email || !nome) return json({ error: "faltam_campos" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "email_invalido" }, 400);
  const senha = (body.senha || "").trim() || gerarSenha();
  if (senha.length < 6) return json({ error: "senha_curta" }, 400);

  // 4) Cria a conta já confirmada, marcada como nutri.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, tipo: "nutri" },
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
      return json({ error: "email_em_uso" }, 409);
    return json({ error: "falha_criar_usuario", detail: createErr?.message }, 500);
  }
  const newUserId = created.user.id;

  // Garante tipo=nutri no profile mesmo se o trigger rodar sem o metadata
  // (idempotente; o trigger normalmente já grava certo).
  await admin.from("profiles").update({ tipo: "nutri", nome }).eq("id", newUserId);

  // 5) Registra o convite (auditoria). Falha aqui não desfaz a conta —
  //    o login já é válido; o registro é secundário.
  await admin.from("nutri_convites").insert({
    convidado_por: callerId,
    user_id: newUserId,
    nome,
    email,
    observacao: (body.observacao || "").trim() || null,
  });

  return json({ ok: true, user_id: newUserId, email, senha });
});
