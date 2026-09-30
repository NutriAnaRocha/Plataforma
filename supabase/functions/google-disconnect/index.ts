// ============================================================
//  Edge Function: google-disconnect
//  A nutri (autenticada) desconecta o Google. Revogamos o refresh_token
//  no Google (o front nunca vê o token) e só então apagamos as linhas de
//  google_secret e google_conta. Se a revogação falhar (token já revogado
//  ou expirado), apagamos mesmo assim: o objetivo é a conexão sumir.
//
//  Exige JWT válido (nutri logada).
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const nutriId = userRes.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1) Revoga no Google (revogar o refresh_token derruba a concessão inteira).
  let revogado: boolean | null = null;
  const { data: sec } = await admin
    .from("google_secret").select("refresh_token").eq("nutricionista_id", nutriId).maybeSingle();
  if (sec?.refresh_token) {
    try {
      const r = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: sec.refresh_token }),
      });
      revogado = r.ok;
      if (!r.ok) console.warn("google revoke falhou", r.status, await r.text());
    } catch (e) {
      revogado = false;
      console.warn("google revoke erro de rede", String(e));
    }
  }

  // 2) Apaga a conexão local.
  const [a, b] = await Promise.all([
    admin.from("google_secret").delete().eq("nutricionista_id", nutriId),
    admin.from("google_conta").delete().eq("nutricionista_id", nutriId),
  ]);
  if (a.error || b.error) return json({ error: "delete_failed", detail: (a.error || b.error)!.message }, 500);

  console.log("google-disconnect", nutriId, "revogado:", revogado);
  return json({ ok: true, revogado });
});
