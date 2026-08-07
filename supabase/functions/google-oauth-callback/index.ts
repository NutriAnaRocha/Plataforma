// ============================================================
//  Edge Function: google-oauth-callback
//  O Google redireciona o NAVEGADOR para cá (GET, sem JWT) depois que a
//  nutri autoriza. Trocamos o "code" por tokens, guardamos o refresh_token
//  no cofre (google_secret) e o e-mail em google_conta, e mandamos o
//  navegador de volta para a tela de configurações.
//
//  IMPORTANTE: fazer o DEPLOY desta função com verify_jwt = false
//  (o Google não envia Authorization). A segurança vem do NONCE de uso único.
//
//  Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;
const FALLBACK_RETURN = "https://app.nutrianaluisarocha.com/configuracoes.html";

// Redireciona o navegador de volta à plataforma, sinalizando sucesso/erro.
function backTo(returnTo: string, status: "ok" | "erro", detail?: string) {
  const sep = returnTo.includes("?") ? "&" : "?";
  let url = `${returnTo}${sep}google=${status}`;
  if (detail) url += `&msg=${encodeURIComponent(detail.slice(0, 120))}`;
  return new Response(null, { status: 302, headers: { Location: url } });
}

// Extrai o e-mail do id_token (JWT) sem verificar assinatura — é só exibição,
// e a fonte é o próprio endpoint de token do Google (canal confiável).
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    const norm = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = norm + "=".repeat((4 - (norm.length % 4)) % 4);
    const obj = JSON.parse(atob(pad));
    return typeof obj.email === "string" ? obj.email : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state") || "";
  const oauthErr = u.searchParams.get("error");

  // state = "nonce|returnTo"
  const sepIdx = state.indexOf("|");
  const nonce = sepIdx >= 0 ? state.slice(0, sepIdx) : state;
  const returnTo = sepIdx >= 0 ? state.slice(sepIdx + 1) : FALLBACK_RETURN;

  if (oauthErr) return backTo(returnTo, "erro", oauthErr);
  if (!code || !nonce) return backTo(returnTo, "erro", "faltou code/state");
  if (!CLIENT_ID || !CLIENT_SECRET) return backTo(returnTo, "erro", "Google não configurado");

  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1) Valida e CONSOME o nonce (uso único, não expirado).
  const { data: st } = await admin
    .from("google_oauth_state")
    .select("nutricionista_id, expires_at")
    .eq("nonce", nonce)
    .maybeSingle();
  if (!st) return backTo(returnTo, "erro", "sessão expirada, tente de novo");
  await admin.from("google_oauth_state").delete().eq("nonce", nonce);
  if (new Date(st.expires_at).getTime() < Date.now()) return backTo(returnTo, "erro", "sessão expirada");
  const nutriId = st.nutricionista_id as string;

  // 2) Troca o code por tokens.
  let tok: { refresh_token?: string; access_token?: string; id_token?: string; error?: string; error_description?: string };
  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    tok = await resp.json();
    if (!resp.ok) return backTo(returnTo, "erro", tok.error_description || tok.error || "falha na troca de token");
  } catch (e) {
    return backTo(returnTo, "erro", "erro de rede com o Google");
  }

  const email = emailFromIdToken(tok.id_token);

  // 3) Guarda o refresh_token no cofre. Se o Google não devolveu um novo
  //    (raro, pois forçamos prompt=consent), mantemos o que já existia.
  if (tok.refresh_token) {
    const { error: secErr } = await admin
      .from("google_secret")
      .upsert({ nutricionista_id: nutriId, refresh_token: tok.refresh_token, updated_at: new Date().toISOString() });
    if (secErr) return backTo(returnTo, "erro", "falha ao guardar o token");
  } else {
    const { data: existing } = await admin
      .from("google_secret").select("nutricionista_id").eq("nutricionista_id", nutriId).maybeSingle();
    if (!existing) return backTo(returnTo, "erro", "o Google não devolveu o token; refaça a conexão");
  }

  // 4) Marca a conta como conectada (parte visível ao front).
  await admin.from("google_conta").upsert({
    nutricionista_id: nutriId,
    email,
    conectado: true,
    updated_at: new Date().toISOString(),
  });

  return backTo(returnTo, "ok");
});
