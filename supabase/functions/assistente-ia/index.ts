// ============================================================
//  Edge Function: assistente-ia  (Nútri AI conversacional)
//  A nutri (autenticada) conversa em linguagem natural. Opcionalmente
//  informa um paciente_id em contexto — a function busca a linha do
//  paciente USANDO O JWT DA NUTRI (RLS aplica: ela só vê os próprios),
//  monta um contexto clínico enxuto e conversa com o modelo.
//
//  OpenAI, gpt-4o-mini (secret OPENAI_API_KEY; modelo via OPENAI_MODEL).
//  A IA é copiloto: sugere, nunca prescreve por conta própria. A nutri
//  revisa e valida tudo antes de usar com o paciente (escopo CFN).
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

const SYSTEM_PROMPT = `Você é o "Nútri AI", copiloto clínico de uma nutricionista brasileira (saúde da mulher e fertilidade). Você fala COM A NUTRICIONISTA (colega de profissão), não com o paciente.

Suas funções: interpretar exames, sugerir cardápios e substituições, resumir a evolução de um paciente, apoiar cálculos de gasto energético (TMB/GET/VET) e redigir rascunhos de orientações — sempre a partir dos dados que a nutri te fornece no contexto.

Regras invioláveis:
- Você é COPILOTO: sugere, organiza, rascunha. A decisão clínica e a validação são SEMPRE da nutricionista. Feche respostas de conduta lembrando que ela deve revisar antes de aplicar.
- Fique no ESCOPO do nutricionista. NÃO prescreva medicamentos nem doses de fármacos; para isso, oriente encaminhar ao médico.
- NÃO invente dados. Se um exame, peso ou informação NÃO está no contexto fornecido, diga que não tem esse dado — nunca preencha com números plausíveis. Baseie-se apenas no contexto do paciente e em consenso de boas práticas.
- NÃO prometa cura nem resultado garantido; nada que viole o Código de Ética do nutricionista (CFN) — sem sensacionalismo.
- Seja objetiva e prática. Use listas curtas quando ajudar. Português do Brasil, tom profissional e cordial.
- Pode usar markdown leve (negrito, listas, títulos com ##). Não use blocos de código a menos que peçam.
- Se não houver paciente em contexto, responda de forma geral e, quando útil, sugira selecionar um paciente para respostas com dados reais.`;

// Monta um resumo textual enxuto da linha do paciente para o contexto do modelo.
// Só inclui o que existe — evita "campo: null" e mantém o prompt curto/barato.
function resumoPaciente(p: Record<string, any>): string {
  const L: string[] = [];
  const add = (label: string, v: unknown) => {
    if (v === null || v === undefined || v === "" ) return;
    L.push(`- ${label}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  };
  add("Nome", p.nome);
  add("Idade", p.idade);
  add("Sexo", p.sexo);
  add("Objetivo", p.objetivo);
  add("Status", p.status);
  add("Adesão (%)", p.adesao);
  add("Peso atual (kg)", p.peso_atual);
  add("Peso inicial (kg)", p.peso_inicial);
  add("Meta de peso (kg)", p.meta);
  add("Altura (m)", p.altura);
  add("IMC", p.imc);
  add("Restrições", p.restricoes);
  add("Anamnese", p.anamnese);
  add("Observações", p.observacoes);
  add("Tags", Array.isArray(p.tags) && p.tags.length ? p.tags.join(", ") : null);

  // jsonb ricos — passamos compactado e truncado para não estourar o contexto.
  const jsonBlock = (label: string, v: unknown, max = 1800) => {
    if (!v) return;
    let s: string;
    try { s = JSON.stringify(v); } catch { return; }
    if (!s || s === "[]" || s === "{}" || s === '{"labels":[],"peso":[]}') return;
    if (s.length > max) s = s.slice(0, max) + "…(truncado)";
    L.push(`- ${label}: ${s}`);
  };
  jsonBlock("Evolução (peso ao longo do tempo)", p.evolucao, 1200);
  jsonBlock("Consultas", p.consultas);
  jsonBlock("Exames", p.exames, 2500);
  jsonBlock("Prescrições/planos alimentares", p.prescricoes, 2500);
  jsonBlock("Treino", p.treino);
  jsonBlock("Metas", p.metas);

  return L.join("\n");
}

interface ChatMsg { role?: string; content?: unknown }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
  const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  if (!OPENAI_KEY) return json({ error: "IA não configurada (falta OPENAI_API_KEY)." }, 500);

  // 1) Exige nutri autenticada.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);

  // 2) Corpo: histórico de mensagens + paciente opcional.
  let body: { messages?: ChatMsg[]; paciente_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  // Sanitiza o histórico: só user/assistant, string, tamanho limitado.
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const history = raw
    .map((m) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content == null ? "" : m.content).trim().slice(0, 4000),
    }))
    .filter((m) => m.content)
    .slice(-12); // últimas 12 trocas bastam; controla custo
  if (!history.length) return json({ error: "Envie ao menos uma mensagem." }, 400);

  // 3) Contexto do paciente (se houver) — busca com o JWT da nutri (RLS aplica).
  let contexto = "";
  const pid = String(body.paciente_id || "").trim();
  if (pid) {
    const { data: pac, error: pacErr } = await asCaller
      .from("pacientes")
      .select("*")
      .eq("id", pid)
      .maybeSingle();
    if (pacErr) return json({ error: "Falha ao carregar o paciente.", detail: pacErr.message }, 502);
    if (pac) contexto = resumoPaciente(pac);
    // Se não achou (ex.: id de outra nutri), simplesmente segue sem contexto.
  }

  const messages: ChatMsg[] = [{ role: "system", content: SYSTEM_PROMPT }];
  if (contexto) {
    messages.push({
      role: "system",
      content:
        "DADOS DO PACIENTE EM CONTEXTO (fonte de verdade — use apenas isto; não invente além):\n" +
        contexto,
    });
  } else {
    messages.push({
      role: "system",
      content: "Nenhum paciente selecionado. Responda de forma geral; se precisar de dados reais, sugira selecionar um paciente.",
    });
  }
  for (const m of history) messages.push(m);

  // 4) Chama a OpenAI.
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        temperature: 0.5,
        messages,
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      return json({ error: "Falha na IA (OpenAI).", detail: detail.slice(0, 500) }, 502);
    }
    const data = await resp.json();
    const texto = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!texto) return json({ error: "A IA não retornou conteúdo." }, 502);
    return json({ ok: true, resposta: texto, modelo: MODEL, com_contexto: !!contexto });
  } catch (e) {
    return json({ error: "erro_rede_ia", detail: String(e).slice(0, 300) }, 502);
  }
});
