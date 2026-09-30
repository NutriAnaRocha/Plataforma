// ============================================================
//  Edge Function: mercado-painel
//
//  Os números do RotuLens para a Ana: quem assinou, quanto entrou,
//  quantas pessoas usaram o app (inclusive quem só usou de graça) e
//  quanto isso custou de IA.
//
//  Por que uma função e não PostgREST: as tabelas do RotuLens são
//  fechadas por RLS de propósito (o app inteiro fala com o banco pelo
//  anon). Abrir leitura para "authenticated" daria acesso a qualquer
//  paciente logado na NutriPlat. Aqui o caminho é outro: confere o JWT de
//  quem chamou, confere profiles.is_admin com service_role, e só então
//  chama a RPC mercado_painel (migrações 0079 e 0080), que é
//  executável apenas pelo service_role.
//
//  Além de ler, esta função escreve uma coisa só: a lista de
//  "internos" (migração 0080) — o aparelho, o código ou o e-mail que é
//  da própria Ana e não deve contar como usuário. É o que o botão
//  "não contar este aparelho" do painel chama. Escrita mínima e
//  reversível, com o mesmo cadeado de is_admin.
//
//  Login: a Ana entra com a conta que já usa na NutriPlat
//  (nutrianalrocha@gmail.com). Não existe senha nova para guardar.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIPOS = ["dispositivo", "codigo", "email"];

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

  // 1) Quem está chamando?
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2) É administradora? (checado com service_role, sem depender de RLS)
  const { data: perfil, error: perfilErr } = await admin
    .from("profiles").select("is_admin,nome,email").eq("id", userRes.user.id).maybeSingle();
  if (perfilErr) return json({ error: "erro_perfil" }, 500);
  if (!perfil || perfil.is_admin !== true) return json({ error: "nao_autorizado" }, 403);

  // 3) O corpo: janela pedida e, opcionalmente, uma marcação a fazer
  //    antes de recalcular (para a tela já voltar com o número novo).
  let dias = 30;
  let acao = "";
  let tipo = "";
  let valor = "";
  let motivo = "";
  try {
    const body = await req.json();
    const n = Number(body?.dias);
    if (Number.isFinite(n)) dias = Math.min(Math.max(Math.round(n), 1), 730);
    acao = String(body?.acao || "");
    tipo = String(body?.tipo || "");
    valor = String(body?.valor || "").trim();
    motivo = String(body?.motivo || "").trim().slice(0, 200);
  } catch { /* corpo vazio: fica no padrão */ }

  if (acao === "ignorar" || acao === "voltar") {
    if (!TIPOS.includes(tipo) || !valor || valor.length > 200) {
      return json({ error: "marcacao_invalida" }, 400);
    }
    const rpc = acao === "ignorar" ? "mercado_marcar_interno" : "mercado_desmarcar_interno";
    const args = acao === "ignorar"
      ? { p_tipo: tipo, p_valor: valor, p_motivo: motivo }
      : { p_tipo: tipo, p_valor: valor };
    const { error: mErr } = await admin.rpc(rpc, args);
    if (mErr) return json({ error: "erro_marcacao", detail: mErr.message }, 500);
  }

  const { data, error } = await admin.rpc("mercado_painel", { p_dias: dias });
  if (error) return json({ error: "erro_painel", detail: error.message }, 500);

  return json({ ok: true, quem: perfil.nome || perfil.email, dados: data });
});
