// ============================================================
//  Edge Function: google-oauth-start
//  A nutri (autenticada) pede para conectar a conta Google. Devolvemos a
//  URL do consentimento do Google. Como o callback do Google não carrega o
//  JWT da nutri, criamos aqui um NONCE de uso único (tabela google_oauth_state)
//  que amarra o retorno à nutri certa.
//
//  Secrets do projeto: GOOGLE_CLIENT_ID (o CLIENT_SECRET só é usado no
//  callback). Exige JWT válido (nutri logada).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";

// Precisa bater EXATAMENTE com o "Authorized redirect URI" no Google Cloud.
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;

// calendar.events: criar/editar/apagar eventos (Meet vem junto). openid+email:
// descobrir qual conta foi conectada (só p/ exibir).
const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!CLIENT_ID) return json({ error: "Google não configurado (falta GOOGLE_CLIENT_ID)." }, 500);

  // 1) Exige nutri autenticada.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const nutriId = userRes.user.id;

  // 2) De onde a nutri veio (p/ voltar à mesma tela depois). Só aceitamos o
  //    domínio da plataforma no github.io, senão caímos no padrão.
  let returnTo = "https://nutrianarocha.github.io/Plataforma/prototipo/configuracoes.html";
  try {
    const body = await req.json();
    const rt = String(body?.returnTo || "");
    if (/^https:\/\/nutrianarocha\.github\.io\//.test(rt)) returnTo = rt;
  } catch { /* corpo opcional */ }

  // 3) Cria o nonce (service role) que o callback vai consumir.
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
  const nonce = crypto.randomUUID() + "." + crypto.randomUUID();
  const { error: insErr } = await admin.from("google_oauth_state").insert({
    nonce,
    nutricionista_id: nutriId,
  });
  if (insErr) return json({ error: "state_insert_failed", detail: insErr.message }, 500);

  // O returnTo viaja junto do nonce, separado por "|" (o nonce não contém "|").
  const state = `${nonce}|${returnTo}`;

  // 4) Monta a URL de consentimento. access_type=offline + prompt=consent
  //    garantem que o Google devolva um refresh_token.
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return json({ ok: true, url });
});
