// ============================================================
//  Edge Function: criar-conta-paciente  (PÚBLICA — sem JWT)
//  O paciente se cadastra sozinho em /cadastro-paciente (15/09/2026).
//
//  Em ordem:
//   1. valida o formulário (CPF com dígito verificador);
//   2. recusa CPF que já tem conta — antes de criar o usuário, para não
//      deixar login órfão;
//   3. cria a conta já confirmada via admin API (o signup público do
//      Supabase segue desligado — ver index.html);
//   4. grava telefone, CPF e foto no profile e o objetivo em
//      paciente_preferencias (0088). Se o profile falhar, a conta é
//      apagada: paciente sem CPF gravado é cadastro pela metade.
//
//  A conta nasce sem nutri. O vínculo só existe quando uma nutricionista
//  aceita a solicitação (0089) ou cadastra o paciente na carteira dela.
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

const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (base: string, peso: number) => {
    let soma = 0;
    for (const d of base) soma += Number(d) * peso--;
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    dv(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

// A foto chega comprimida pelo navegador (foto-upload.js: 320px, JPEG).
// ~400 KB de texto é folga larga para isso e barra quem mandar outra coisa.
const FOTO_MAX = 400_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const nome = txt(body.nome, 80);
  const email = txt(body.email, 120).toLowerCase();
  const telefone = txt(body.telefone, 20).replace(/\D/g, "");
  const cpf = txt(body.cpf, 20).replace(/\D/g, "");
  const objetivo = txt(body.objetivo, 120);
  const senha = String(body.senha ?? "");
  const fotoBruta = String(body.foto ?? "");
  const foto = fotoBruta.startsWith("data:image/jpeg;base64,") && fotoBruta.length <= FOTO_MAX
    ? fotoBruta
    : null;

  if (!nome || !email || !telefone || !cpf || !objetivo) return json({ error: "faltam_campos" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "email_invalido" }, 400);
  if (telefone.length < 10 || telefone.length > 13) return json({ error: "telefone_invalido" }, 400);
  if (!cpfValido(cpf)) return json({ error: "cpf_invalido" }, 400);
  if (senha.length < 6) return json({ error: "senha_curta" }, 400);
  if (body.aceite !== true) return json({ error: "sem_aceite" }, 400);

  const { data: jaTem } = await admin.from("profiles").select("id").eq("cpf", cpf).maybeSingle();
  if (jaTem) return json({ error: "cpf_em_uso" }, 409);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, tipo: "paciente" },
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
      return json({ error: "email_em_uso" }, 409);
    return json({ error: "falha_criar_usuario", detail: createErr?.message }, 500);
  }
  const userId = created.user.id;

  const { error: perfilErr } = await admin.from("profiles").update({
    tipo: "paciente",
    nome,
    telefone,
    cpf,
    avatar_url: foto,
  }).eq("id", userId);

  if (perfilErr) {
    // Corrida no índice único do CPF, ou falha real: desfaz a conta por id.
    await admin.auth.admin.deleteUser(userId);
    if ((perfilErr.message || "").includes("profiles_cpf_uidx"))
      return json({ error: "cpf_em_uso" }, 409);
    return json({ error: "falha_perfil", detail: perfilErr.message }, 500);
  }

  const { error: prefErr } = await admin.from("paciente_preferencias").upsert({
    user_id: userId,
    objetivo,
    respostas: { origem: "cadastro" },
    updated_at: new Date().toISOString(),
  });
  // O objetivo ajuda, mas não vale derrubar uma conta já pronta.
  if (prefErr) console.error("criar-conta-paciente: preferências não gravadas", prefErr.message);

  return json({ ok: true, user_id: userId, email });
});
