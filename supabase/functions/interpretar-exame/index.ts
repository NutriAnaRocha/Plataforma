// ============================================================
//  Edge Function: interpretar-exame
//  A nutri (autenticada) envia foto(s)/imagem de um exame laboratorial
//  e recebe uma LEITURA em linguagem clara: principais achados, o que
//  está fora da referência e o significado nutricional. É apoio à
//  decisão — não substitui o laudo nem o julgamento clínico.
//
//  Usa a API da OpenAI (modelo com visão). A chave fica no secret
//  OPENAI_API_KEY do projeto (nunca no front). Modelo configurável
//  via OPENAI_MODEL (padrão: gpt-4o).
//
//  Segurança: exige JWT válido (qualquer nutri logada). As imagens
//  trafegam como data URL e não são persistidas aqui.
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

const SYSTEM_PROMPT = `Você é uma assistente de um consultório de nutrição no Brasil.
Recebe FOTO(S) de exames laboratoriais e ajuda a nutricionista a ler os resultados.

Regras:
- Responda SEMPRE em português do Brasil, claro e objetivo.
- NÃO invente valores: use apenas o que estiver legível na imagem. Se algo estiver ilegível, diga.
- Organize a resposta em seções com títulos terminados em ":" e itens começando com "- ".
- Estruture assim:
  "Resumo:" (2–3 linhas sobre o quadro geral)
  "Fora da referência:" (liste marcador, valor, referência e o que sugere; se nada, escreva "Tudo dentro da referência.")
  "Dentro da referência:" (liste rapidamente os normais relevantes)
  "Sugestões nutricionais:" (condutas dietéticas gerais ligadas aos achados)
- Foque no que é relevante para nutrição (glicemia, lipídios, ferro, vitaminas, tireoide, função hepática/renal, inflamação).
- Encerre com: "Isto é um apoio à leitura — confirme sempre no laudo e use seu julgamento clínico."
- Não prescreva medicamentos. Não faça diagnóstico definitivo.`;

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

  // 2) Corpo.
  let body: { paciente?: { nome?: string; sexo?: string; idade?: number }; imagens?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  // Apenas imagens (a visão da OpenAI não lê PDF por data URL).
  const imagens = (body.imagens || []).filter((u) => typeof u === "string" && /^data:image\//i.test(u)).slice(0, 4);
  if (!imagens.length) {
    return json({ error: "Envie ao menos uma FOTO/imagem do exame (PDF não é lido diretamente — fotografe a página)." }, 400);
  }

  const pac = body.paciente || {};
  const ctxPaciente =
    `Contexto do paciente: ${pac.nome || "não informado"}` +
    `${pac.sexo ? ", sexo " + (pac.sexo === "M" ? "masculino" : "feminino") : ""}` +
    `${pac.idade != null ? ", " + pac.idade + " anos" : ""}.`;

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: `${ctxPaciente}\nLeia o(s) exame(s) da(s) imagem(ns) e resuma os achados.` },
    ...imagens.map((url) => ({ type: "image_url", image_url: { url, detail: "high" } })),
  ];

  // 3) Chama a OpenAI.
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return json({ error: "Falha na IA (OpenAI).", detail: detail.slice(0, 500) }, 502);
    }
    const data = await resp.json();
    const texto = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!texto) return json({ error: "A IA não retornou conteúdo." }, 502);
    return json({ ok: true, interpretacao: texto, modelo: MODEL });
  } catch (e) {
    return json({ error: "erro_rede_ia", detail: String(e).slice(0, 300) }, 502);
  }
});
