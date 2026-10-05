// ============================================================
//  Edge Function: criar-conta-nutri  (PÚBLICA — sem JWT)
//  A nutricionista se inscreve sozinha em /seja-indicada (14/09/2026).
//
//  O que acontece aqui, em ordem:
//   1. valida o formulário (o CRN é obrigatório e não é conferido por robô —
//      não existe consulta pública confiável; quem confere é a Ana);
//   2. cria a conta já confirmada via admin API (o signup público do Supabase
//      segue desligado — ver index.html; a API admin não passa por ele);
//   3. grava o perfil com o que o quiz respondeu, em 'rascunho': nada vai à
//      vitrine antes da curadoria (CFN 856 — não se anuncia registro que
//      ninguém checou);
//   4. registra a inscrição em nutri_cadastros, que é a fila de análise;
//   5. manda o e-mail de "cadastro recebido". Se RESEND_API_KEY não estiver
//      configurada, o cadastro NÃO falha: fica email_enviado=false e a tela
//      já avisa o prazo na hora. E-mail é confirmação, não é o recibo.
//
//  A conta nasce 'pendente' (0094): sem teste grátis, o acesso e a vitrine
//  só liberam depois do primeiro pagamento.
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

// Um plano só desde 15/09/2026 (0094): a vitrine vem com a plataforma.
const TIERS = ["plataforma"];
const CICLOS = ["mensal", "anual"];

const PLANO_NOME: Record<string, string> = {
  plataforma: "NutriPlat",
};

/** E-mail de "recebemos seu cadastro". Só sai se houver chave configurada. */
async function enviarEmail(nome: string, email: string, plano: string): Promise<boolean> {
  const KEY = Deno.env.get("RESEND_API_KEY");
  const DE = Deno.env.get("EMAIL_REMETENTE"); // ex.: "NutriPlat <contato@nutrianaluisarocha.com>"
  if (!KEY || !DE) return false;

  const primeiro = nome.split(/\s+/)[0] || nome;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#22323a">
      <p>Olá, ${primeiro}!</p>
      <p>Recebemos o seu cadastro na <strong>NutriPlat</strong>. Ele está na fila de análise.</p>
      <p>Conferimos o seu registro no CRN e, <strong>em até 7 dias</strong>, se estiver tudo certo,
         o seu perfil é publicado em <em>Encontre sua nutri</em> e você recebe um novo aviso.</p>
      <p>Plano escolhido: <strong>${plano}</strong>. O acesso à plataforma libera assim que o pagamento é confirmado.</p>
      <p>Enquanto isso, você já pode entrar na plataforma e completar o seu perfil —
         foto e apresentação são o que fazem o paciente clicar.</p>
      <p><a href="https://nutriplat.com.br/">nutriplat.com.br</a></p>
      <p style="color:#6b7c85;font-size:13px">NutriPlat · plataforma de gestão para nutricionistas</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: DE,
        to: [email],
        subject: "Cadastro recebido — NutriPlat",
        html,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const nome = txt(body.nome, 80);
  const email = txt(body.email, 120).toLowerCase();
  const senha = String(body.senha ?? "");
  const crn = txt(body.crn, 20);
  const telefone = txt(body.telefone, 20);
  const cidade = txt(body.cidade, 60);
  const estado = txt(body.estado, 2).toUpperCase();
  const motivo = txt(body.motivo_entrada, 400);
  const atendeOnline = body.atende_online !== false;
  const atendePresencial = body.atende_presencial === true;
  const desde = parseInt(String(body.atuacao_desde ?? ""), 10);
  const especialidades = Array.isArray(body.especialidades)
    ? (body.especialidades as unknown[]).map((e) => txt(e, 40)).filter(Boolean).slice(0, 8)
    : [];

  let tier = txt(body.plano_tier, 20);
  let ciclo = txt(body.plano_ciclo, 20);
  if (!TIERS.includes(tier)) tier = "plataforma";
  if (!CICLOS.includes(ciclo)) ciclo = "mensal";

  if (!nome || !email || !crn) return json({ error: "faltam_campos" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "email_invalido" }, 400);
  if (senha.length < 6) return json({ error: "senha_curta" }, 400);
  if (!atendeOnline && !atendePresencial) return json({ error: "modalidade_ausente" }, 400);
  // O CRN tem UF + número; aceita "CRN-4 12345", "CRN4 12345", "4 12345".
  if (!/\d{3,}/.test(crn)) return json({ error: "crn_invalido" }, 400);

  // 1) Conta. Se o e-mail já existe, manda entrar em vez de duplicar.
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
  const userId = created.user.id;

  // 2) O que o quiz respondeu vai para o perfil. perfil_status fica em
  //    'rascunho' — a publicação é um ato da curadoria, não deste cadastro.
  const perfil: Record<string, unknown> = {
    tipo: "nutri",
    nome,
    crn,
    cidade: cidade || null,
    estado: estado || null,
    telefone: telefone || null,
    area_atuacao: especialidades,
    atende_online: atendeOnline,
    atende_presencial: atendePresencial,
    motivo_entrada: motivo || null,
  };
  // Foto e apresentação (15/09/2026). Os limites são os da 0086: a
  // apresentação tem check de 40 a 220 caracteres, e fora disso o update
  // inteiro seria recusado — então só entra o que passa.
  const apresentacao = txt(body.apresentacao, 220);
  if (apresentacao.length >= 40) perfil.apresentacao = apresentacao;
  const foto = String(body.avatar_url ?? "");
  if (foto.startsWith("data:image/jpeg;base64,") && foto.length <= 400_000) perfil.avatar_url = foto;

  if (Number.isFinite(desde) && desde > 1950 && desde <= new Date().getFullYear()) {
    perfil.atuacao_desde = desde;
  }
  const { error: perfilErr } = await admin.from("profiles").update(perfil).eq("id", userId);
  if (perfilErr) {
    // A conta já existe e o login funciona; o perfil ela completa no app.
    console.error("criar-conta-nutri: perfil não gravado", perfilErr.message);
  }

  // 2.1) Cupom da embaixadora (0096). A tela já conferiu; aqui a regra é do
  //      banco. Cupom inválido não derruba o cadastro — a conta já existe.
  let cupomAplicado = false;
  const cupom = txt(body.cupom, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cupom) {
    const { data: rc } = await admin.rpc("aplicar_cupom", { p_cupom: cupom, p_user: userId });
    cupomAplicado = (rc as { ok?: boolean } | null)?.ok === true;
  }

  // 3) A fila de análise.
  const { data: cadastro, error: cadErr } = await admin.from("nutri_cadastros").insert({
    user_id: userId,
    nome, email, telefone: telefone || null, crn,
    estado: estado || null, cidade: cidade || null,
    atende_online: atendeOnline, atende_presencial: atendePresencial,
    especialidades,
    atuacao_desde: Number.isFinite(desde) ? desde : null,
    motivo_entrada: motivo || null,
    plano_tier: tier, plano_ciclo: ciclo,
  }).select("id").maybeSingle();
  if (cadErr) console.error("criar-conta-nutri: fila não gravada", cadErr.message);

  // 4) E-mail — opcional por definição: ver o cabeçalho.
  const enviado = await enviarEmail(nome, email, PLANO_NOME[tier] ?? tier);
  if (enviado && cadastro?.id) {
    await admin.from("nutri_cadastros").update({ email_enviado: true }).eq("id", cadastro.id);
  }

  return json({ ok: true, user_id: userId, email, email_enviado: enviado, prazo_dias: 7, cupom_aplicado: cupomAplicado });
});
