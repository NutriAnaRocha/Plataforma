// ============================================================
//  Edge Function: gerar-apresentacao
//  A nutri (autenticada) pede um rascunho da APRESENTAÇÃO do perfil público
//  — a frase que aparece no card do diretório e é o que faz o paciente
//  clicar. Devolve 3 opções curtas; ela escolhe, edita e salva.
//
//  Por que existe: é o campo em que mais gente trava. Quem sabe atender não
//  necessariamente sabe se apresentar, e um card sem apresentação não
//  converte — pior, não passa na validação de publicar_perfil().
//
//  A IA parte do que JÁ ESTÁ no perfil (especialidades, cidade, bio, tempo
//  de atuação). Não inventa formação, número de pacientes nem resultado.
//
//  Usa a API da OpenAI. Chave no secret OPENAI_API_KEY (nunca no front),
//  modelo em OPENAI_MODEL (padrão gpt-4o-mini). Exige JWT de nutri.
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

const SYSTEM_PROMPT = `Você ajuda nutricionistas brasileiras a escrever a apresentação do
perfil público delas num diretório onde pacientes procuram atendimento.

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{ "opcoes": ["texto 1", "texto 2", "texto 3"] }

Regras de escrita:
- Cada opção entre 90 e 200 caracteres. Português do Brasil.
- PRIMEIRA PESSOA ("eu cuido de...", "atendo mulheres que..."). Nunca terceira pessoa.
- Fale COM o paciente e sobre o problema dele, não sobre títulos da profissional.
- Tom de gente: acolhedor, direto, sem jargão e sem palavra de marketing
  ("expert", "transformação", "método exclusivo", "referência" estão proibidos).
- Use SOMENTE o que vier nos dados. Não invente formação, prêmio, número de
  pacientes, anos de experiência nem resultado.
- NÃO prometa resultado, cura, perda de peso em prazo, nem use superlativo —
  o Código de Ética do nutricionista (CFN) veda promessa e sensacionalismo.
- Sem emoji, sem hashtag, sem markdown, sem aspas dentro do texto.
- As três opções devem ter ângulos diferentes entre si.`;

function txt(v: unknown, max = 400) {
  return String(v ?? "").trim().slice(0, max);
}

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

  // 2) O perfil vem do banco pelo JWT da própria nutri (RLS), não do corpo —
  //    assim ninguém pede rascunho "em nome de" outra pessoa.
  const { data: p } = await asCaller.from("profiles")
    .select("nome,cidade,estado,bio,area_atuacao,area_atuacao_outro,atuacao_desde,atende_online,atende_presencial")
    .maybeSingle();
  if (!p) return json({ error: "perfil_nao_encontrado" }, 404);

  let body: { publico?: string } = {};
  try { body = await req.json(); } catch { /* corpo é opcional */ }

  const areas: string[] = Array.isArray(p.area_atuacao) ? p.area_atuacao : [];
  const modos = [p.atende_online ? "online" : "", p.atende_presencial ? "presencial" : ""]
    .filter(Boolean).join(" e ");

  const dados = [
    `Especialidades: ${areas.join(", ") || "não informadas"}`,
    p.area_atuacao_outro ? `Outra área: ${txt(p.area_atuacao_outro, 120)}` : "",
    p.cidade ? `Cidade: ${txt(p.cidade, 60)}${p.estado ? "/" + txt(p.estado, 2) : ""}` : "",
    modos ? `Atende: ${modos}` : "",
    p.atuacao_desde ? `Atua desde: ${p.atuacao_desde}` : "",
    p.bio ? `Bio atual (use como matéria-prima, não copie): ${txt(p.bio, 600)}` : "",
    body.publico ? `Quem ela quer atender: ${txt(body.publico, 300)}` : "",
  ].filter(Boolean).join("\n");

  // 3) OpenAI.
  let resp: Response;
  try {
    resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Escreva as três opções para esta nutricionista.\n\n${dados}` },
        ],
      }),
    });
  } catch {
    return json({ error: "Não consegui falar com a IA agora. Tente de novo." }, 502);
  }

  if (!resp.ok) {
    return json({ error: "A IA recusou o pedido. Tente de novo em instantes." }, 502);
  }

  const data = await resp.json();
  let opcoes: string[] = [];
  try {
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    opcoes = (Array.isArray(parsed.opcoes) ? parsed.opcoes : [])
      .map((o: unknown) => txt(o, 220))
      .filter((o: string) => o.length >= 40);
  } catch {
    return json({ error: "A resposta da IA veio fora do formato. Tente de novo." }, 502);
  }

  if (!opcoes.length) return json({ error: "Não consegui escrever agora. Tente de novo." }, 502);
  return json({ opcoes });
});
