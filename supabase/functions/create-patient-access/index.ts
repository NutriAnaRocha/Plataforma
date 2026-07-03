// ============================================================
//  Edge Function: create-patient-access
//  A nutri (autenticada) cria o LOGIN de um paciente já existente
//  na sua carteira (ficha em public.pacientes).
//
//  Por que uma function (e não signUp no front):
//   - signUp trocaria a sessão da nutri pela do paciente;
//   - signUp exige confirmação de e-mail (SMTP limitado).
//  Aqui usamos o service_role p/ admin.createUser({ email_confirm:true }),
//  já confirmado, com metadata tipo:'paciente'. O trigger handle_new_user
//  cria o profile com tipo=paciente. Depois gravamos pacientes.user_id.
//
//  Segurança: a nutri só cria acesso p/ ficha DELA (nutricionista_id =
//  auth.uid() do JWT) e que ainda não tenha login (user_id null).
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

// Senha legível (sem caracteres ambíguos) quando a nutri não define uma.
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

  // 1) Identifica a nutri pelo JWT que veio no Authorization.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);

  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const callerId = userRes.user.id;

  // 2) Corpo.
  let body: { paciente_id?: string; email?: string; senha?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const pacienteId = (body.paciente_id || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  if (!pacienteId || !email) return json({ error: "faltam_campos" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "email_invalido" }, 400);
  const senha = (body.senha || "").trim() || gerarSenha();
  if (senha.length < 6) return json({ error: "senha_curta" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3) A ficha é da nutri chamadora e ainda não tem login?
  const { data: pac, error: pacErr } = await admin
    .from("pacientes")
    .select("id,nome,nutricionista_id,user_id")
    .eq("id", pacienteId)
    .maybeSingle();
  if (pacErr) return json({ error: "erro_ficha" }, 500);
  if (!pac) return json({ error: "ficha_inexistente" }, 404);
  if (pac.nutricionista_id !== callerId) return json({ error: "ficha_nao_e_sua" }, 403);
  if (pac.user_id) return json({ error: "ja_tem_acesso" }, 409);

  // 4) Cria o usuário já confirmado, marcado como paciente.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: pac.nome, tipo: "paciente" },
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
      return json({ error: "email_em_uso" }, 409);
    return json({ error: "falha_criar_usuario", detail: createErr?.message }, 500);
  }
  const newUserId = created.user.id;

  // Garante tipo=paciente no profile mesmo se o trigger rodar antes do metadata
  // (idempotente; o trigger normalmente já grava certo).
  await admin.from("profiles").update({ tipo: "paciente" }).eq("id", newUserId);

  // 5) Vincula a ficha ao login.
  const { error: linkErr } = await admin
    .from("pacientes")
    .update({ user_id: newUserId })
    .eq("id", pacienteId);
  if (linkErr) {
    // rollback: remove o usuário criado p/ não deixar login órfão.
    await admin.auth.admin.deleteUser(newUserId);
    return json({ error: "falha_vincular", detail: linkErr.message }, 500);
  }

  return json({ ok: true, user_id: newUserId, email, senha });
});
