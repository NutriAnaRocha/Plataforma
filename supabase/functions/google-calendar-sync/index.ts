// ============================================================
//  Edge Function: google-calendar-sync
//  Espelha UMA consulta no Google Calendar da nutri. Chamada pelo front
//  depois de criar/editar/cancelar/excluir uma consulta.
//
//  Fonte da verdade = a linha em public.consultas. O front manda só o
//  consultaId (+ action opcional). A função:
//    1. Confere que a consulta é da nutri autenticada.
//    2. Pega um access_token novo a partir do refresh_token (cofre).
//    3. Cria/atualiza/apaga o evento (Meet automático se modo = Online).
//    4. Grava google_event_id e meet_url de volta na consulta.
//
//  Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Exige JWT (nutri logada).
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
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const TZ = "America/Sao_Paulo";

// Troca o refresh_token por um access_token válido (~1h).
async function accessTokenFor(refresh: string): Promise<string | null> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) return null;
  const j = await resp.json();
  return j.access_token || null;
}

function meetFromEvent(ev: any): string | null {
  if (ev?.hangoutLink) return ev.hangoutLink;
  const eps = ev?.conferenceData?.entryPoints;
  if (Array.isArray(eps)) {
    const v = eps.find((e: any) => e?.entryPointType === "video" && e?.uri);
    if (v) return v.uri;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!CLIENT_ID || !CLIENT_SECRET) return json({ error: "Google não configurado." }, 500);

  // 1) Nutri autenticada.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const nutriId = userRes.user.id;

  let body: { consultaId?: string; action?: string };
  try { body = await req.json(); } catch { return json({ error: "invalid_body" }, 400); }
  const consultaId = String(body.consultaId || "");
  if (!consultaId) return json({ error: "consultaId obrigatório" }, 400);
  const wantDelete = body.action === "delete";

  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

  // 2) Conta Google conectada?
  const { data: conta } = await admin
    .from("google_conta").select("calendar_id, conectado").eq("nutricionista_id", nutriId).maybeSingle();
  const { data: secret } = await admin
    .from("google_secret").select("refresh_token").eq("nutricionista_id", nutriId).maybeSingle();
  if (!conta || !conta.conectado || !secret) {
    // Sem conexão não é erro fatal: a consulta é salva do mesmo jeito.
    return json({ ok: true, skipped: "google_nao_conectado" });
  }
  const calendarId = conta.calendar_id || "primary";

  // 3) Carrega a consulta e confirma que é da nutri.
  const { data: c } = await admin
    .from("consultas")
    .select("id, nutricionista_id, paciente_nome, data, inicio, fim, tipo, modo, status, observacoes, google_event_id")
    .eq("id", consultaId).maybeSingle();
  if (!c) return json({ error: "consulta_nao_encontrada" }, 404);
  if (c.nutricionista_id !== nutriId) return json({ error: "forbidden" }, 403);

  const token = await accessTokenFor(secret.refresh_token);
  if (!token) {
    // Refresh inválido (revogado / app removido). Marca desconectado.
    await admin.from("google_conta").update({ conectado: false }).eq("nutricionista_id", nutriId);
    return json({ error: "google_reautenticar" }, 409);
  }

  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;
  const hdr = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // ---------- Apagar (exclusão ou cancelamento) ----------
  const shouldRemove = wantDelete || c.status === "cancelada";
  if (shouldRemove) {
    if (c.google_event_id) {
      await fetch(`${base}/events/${encodeURIComponent(c.google_event_id)}`, { method: "DELETE", headers: hdr });
      await admin.from("consultas").update({ google_event_id: null, meet_url: null }).eq("id", consultaId);
    }
    return json({ ok: true, removed: true });
  }

  // ---------- Criar / atualizar ----------
  const startISO = `${c.data}T${String(c.inicio).slice(0, 5)}:00`;
  const endISO = `${c.data}T${String(c.fim).slice(0, 5)}:00`;
  const isOnline = c.modo === "Online";

  const event: Record<string, unknown> = {
    summary: `${c.tipo ? c.tipo + " — " : ""}${c.paciente_nome}`,
    description: (c.observacoes ? c.observacoes + "\n\n" : "") + "Agendado pela Plataforma Nutri.",
    start: { dateTime: startISO, timeZone: TZ },
    end: { dateTime: endISO, timeZone: TZ },
  };
  // Pede um Meet quando é online e ainda não existe conferência no evento.
  if (isOnline) {
    event.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const editing = !!c.google_event_id;
  const url = editing
    ? `${base}/events/${encodeURIComponent(c.google_event_id)}?conferenceDataVersion=1`
    : `${base}/events?conferenceDataVersion=1`;

  const resp = await fetch(url, { method: editing ? "PATCH" : "POST", headers: hdr, body: JSON.stringify(event) });
  if (!resp.ok) {
    const detail = await resp.text();
    return json({ error: "google_api_falhou", detail: detail.slice(0, 400) }, 502);
  }
  const ev = await resp.json();
  const meetUrl = isOnline ? meetFromEvent(ev) : null;

  await admin.from("consultas")
    .update({ google_event_id: ev.id, meet_url: meetUrl })
    .eq("id", consultaId);

  return json({ ok: true, googleEventId: ev.id, meetUrl });
});
