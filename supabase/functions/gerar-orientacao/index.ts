// ============================================================
//  Edge Function: gerar-orientacao
//  A nutri (autenticada) informa um TEMA (ex.: "refluxo", "pré-diabetes")
//  e recebe um RASCUNHO de orientação ao paciente, em blocos, na voz da
//  Ana. É ponto de partida: a nutri revisa, ajusta e valida antes de usar.
//
//  Usa a API da OpenAI. A chave fica no secret OPENAI_API_KEY do projeto
//  (nunca no front). Modelo configurável via OPENAI_MODEL (padrão:
//  gpt-4o-mini). Exige JWT válido (qualquer nutri logada).
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

const CAT_TXT: Record<string, string> = {
  condicao: "uma CONDIÇÃO/sintoma (o texto orienta a alimentação e a rotina para essa condição)",
  tecnica: "uma TÉCNICA de cozinha/dia a dia (o texto ensina o passo a passo)",
  geral: "um tema GERAL de hábito alimentar",
};

// A IA escreve o rascunho voltado AO PACIENTE, na voz da nutri, dentro do
// escopo do nutricionista e das boas práticas do CFN. Devolve só JSON.
const SYSTEM_PROMPT = `Você é assistente de uma nutricionista brasileira (saúde da mulher e fertilidade).
Escreve RASCUNHOS de orientações ALIMENTARES voltadas AO PACIENTE, em português do Brasil,
tom acolhedor, claro e prático (você fala direto com o paciente).

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{
  "resumo": "1 frase curta que resume a orientação",
  "blocos": [
    { "titulo": "Título curto do bloco", "itens": ["orientação 1", "orientação 2"] }
  ],
  "dica_pratica": "1 dica prática e acionável (ou \\"\\")",
  "atencao": "limites e quando procurar médico/reencaminhar (ou \\"\\")"
}

Regras de conteúdo:
- 3 a 4 blocos, cada um com 2 a 4 itens. Itens curtos, concretos, aplicáveis no dia a dia.
- Fale de ALIMENTAÇÃO, hábitos, rotina, sono, hidratação e movimento — dentro do escopo do NUTRICIONISTA.
- NÃO prescreva medicamentos, doses, suplementos específicos nem exames. NÃO prometa cura nem resultado garantido.
- NÃO invente referências, estudos, números ou percentuais que você não tem certeza. Prefira orientação qualitativa.
- Baseie-se em consenso de boas práticas (alimentação equilibrada, comida de verdade, padrão mediterrâneo/DASH quando couber).
- Em "atencao", indique sinais de alerta e a importância do acompanhamento profissional.
- Nada que possa violar o Código de Ética do nutricionista (sem sensacionalismo, sem promessa milagrosa).
- Escreva em texto simples: sem markdown, sem emojis dentro dos itens.`;

interface Bloco { titulo?: string; itens?: unknown }

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
  let body: { tema?: string; categoria?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const tema = String(body.tema || "").trim().slice(0, 160);
  if (!tema) return json({ error: "Informe o tema da orientação (ex.: refluxo, pré-diabetes)." }, 400);
  const catKey = body.categoria && CAT_TXT[body.categoria] ? body.categoria : "condicao";

  const userPrompt =
    `Tema da orientação: "${tema}".\n` +
    `Categoria: ${CAT_TXT[catKey]}.\n` +
    `Escreva o rascunho da orientação ao paciente sobre esse tema, no JSON pedido.`;

  // 3) Chama a OpenAI.
  let out: { resumo?: string; blocos?: Bloco[]; dica_pratica?: string; atencao?: string };
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1100,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      return json({ error: "Falha na IA (OpenAI).", detail: detail.slice(0, 500) }, 502);
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) return json({ error: "A IA não retornou conteúdo." }, 502);
    out = JSON.parse(raw);
  } catch (e) {
    return json({ error: "erro_rede_ia", detail: String(e).slice(0, 300) }, 502);
  }

  // 4) Sanitiza a saída (blocos/itens como strings) antes de devolver.
  const blocos = (Array.isArray(out.blocos) ? out.blocos : [])
    .map((b) => ({
      titulo: String(b?.titulo || "").trim(),
      itens: (Array.isArray(b?.itens) ? b.itens : [])
        .map((i) => String(i == null ? "" : i).trim())
        .filter(Boolean)
        .slice(0, 6),
    }))
    .filter((b) => b.titulo || b.itens.length)
    .slice(0, 5);

  return json({
    ok: true,
    tema,
    resumo: String(out.resumo || "").trim(),
    blocos,
    dica_pratica: String(out.dica_pratica || "").trim(),
    atencao: String(out.atencao || "").trim(),
    modelo: MODEL,
  });
});
