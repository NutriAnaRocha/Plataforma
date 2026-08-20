// ============================================================
//  Edge Function: transcrever-consulta
//
//  Duas ações, uma função:
//
//  "transcrever" (multipart/form-data) → recebe UM segmento de áudio da
//      consulta, devolve o texto e DESCARTA o áudio. O blob morre com o
//      request: não vai para Storage, não vai para tabela, não é logado.
//
//  "nota" (JSON) → recebe a transcrição inteira (que é diálogo: "e como
//      você tem dormido?" / "ah, mal...") e devolve NOTA DE PRONTUÁRIO em
//      terceira pessoa, do jeito que a nutri escreveria à mão.
//
//  Nada é gravado na ficha por aqui. A nutri lê, edita e decide aplicar —
//  mesma regra do anamnese-ia (escopo CFN 856/2026: a IA é copiloto).
//
//  Toda transcrição exige uma linha em consulta_gravacoes provando que
//  houve consentimento ANTES do microfone abrir (LGPD art. 11, I).
//
//  OpenAI: gpt-4o-mini-transcribe (áudio) e gpt-4o-mini (nota).
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

// A OpenAI recusa áudio acima de 25 MB. O front já corta a consulta em
// segmentos de poucos minutos; este teto é a rede de segurança.
const MAX_AUDIO = 24 * 1024 * 1024;
const MAX_TRANSCRICAO = 60000;   // ~50 min de fala transcrita, com folga

const SYSTEM_NOTA = `Você transforma a TRANSCRIÇÃO de uma consulta de nutrição em NOTA DE PRONTUÁRIO, do jeito que a nutricionista brasileira escreveria à mão depois do atendimento.

A transcrição é diálogo cru, feito por máquina. Ela tem erro de reconhecimento, palavra cortada, gente falando por cima, assunto pessoal que não é clínico e trecho sem sentido. Seu trabalho é extrair o que é registro clínico e descartar o resto.

PROIBIDO (isto vale mais que qualquer outra regra):
- Inventar, deduzir ou completar informação que não foi dita. Se não foi dito, não existe.
- Alterar número, dose, medida, unidade, data, frequência ou nome de medicamento, exame ou suplemento. Copie exatamente como veio.
- Diagnosticar, opinar ou propor conduta por conta própria. Você registra o que aconteceu na consulta, não decide o que fazer.
- Transformar hipótese em fato. Se a paciente disse "acho que tenho intolerância", registre como relato dela, não como achado.
- Tratar fala da nutricionista como relato da paciente, ou o contrário.

COMO ESCREVER:
- Terceira pessoa, objetivo e seco, registro de prontuário. Nada de "a paciente compartilhou carinhosamente".
- Sem markdown, sem emoji, sem título decorativo.
- Frase curta. O que foi dito duas vezes entra uma vez.
- Trecho que a transcrição deixou ilegível ou ambíguo NÃO entra na nota: entra em "duvidas".

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{
  "queixa": "o motivo que a paciente deu para estar ali, nas palavras dela resumidas; string vazia se não apareceu",
  "nota": "a nota de prontuário em prosa corrida, com quebras de linha reais separando os assuntos (história, hábito alimentar, sono, intestino, atividade física, sintomas, uso de medicação/suplemento, exames citados)",
  "combinados": ["o que ficou combinado com a paciente nesta consulta, uma frase por item; lista vazia se nada foi combinado"],
  "duvidas": ["trecho que você não conseguiu entender ou que ficou ambíguo, e por isso deixou de fora"]
}

Se a transcrição não tiver conteúdo clínico nenhum (consulta que não aconteceu, áudio de sala vazia, conversa fora do assunto), devolva "nota" como string vazia e explique em "duvidas".`;

/* ------------------------------------------------------------
   Transcrição — o áudio entra, o texto sai, o blob some.
   ------------------------------------------------------------ */

// Ancorar o vocabulário derruba muito erro de reconhecimento em termo
// clínico — é o que faz "anticoncepcional" e "ferritina" saírem inteiros.
// O preço é o eco: quando o áudio é silêncio ou ruído, o modelo devolve
// ESTE texto como se fosse a fala. Ver pareceEco().
const PROMPT_AUDIO =
  "Consulta de nutrição no Brasil. Podem aparecer: anamnese, antropometria, " +
  "circunferência da cintura, bioimpedância, TMB, GET, VET, hemograma, ferritina, " +
  "vitamina D, TSH, HOMA-IR, SOP, endometriose, resistência à insulina, disbiose, " +
  "SIBO, low FODMAP, jejum intermitente, whey protein, creatina, ômega 3, magnésio " +
  "dimalato, inositol, probiótico, mcg, mg, g, kcal.";

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function trigramas(s: string): string[] {
  const w = normalizar(s).split(" ").filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i + 2 < w.length; i++) out.push(w[i] + " " + w[i + 1] + " " + w[i + 2]);
  return out;
}

/* Sem fala reconhecível, o modelo de áudio devolve o prompt de volta —
   e aí uma sala em silêncio vira "consulta" no prontuário. Comparar por
   trigramas pega o eco inteiro e o eco parcial, que é como ele costuma
   sair, sem derrubar a consulta real que por acaso cite "ferritina". */
function pareceEco(texto: string): boolean {
  const t = trigramas(texto);
  if (!t.length) return true;
  const doPrompt = new Set(trigramas(PROMPT_AUDIO));
  let batidas = 0;
  for (const g of t) if (doPrompt.has(g)) batidas++;
  return batidas / t.length >= 0.4;
}

/* O outro jeito de o modelo falhar em áudio ruim é travar numa alça e
   repetir a mesma frase até encher a resposta. */
function pareceLoop(texto: string): boolean {
  const frases = normalizar(texto).split(" ");
  if (frases.length < 12) return false;
  const unicas = new Set(trigramas(texto));
  const total = trigramas(texto).length;
  return total > 8 && unicas.size / total < 0.25;
}

async function transcrever(key: string, audio: File, modelo: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", audio, audio.name || "consulta.webm");
  fd.append("model", modelo);
  fd.append("language", "pt");
  fd.append("response_format", "json");
  fd.append("prompt", PROMPT_AUDIO);

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error("openai_audio:" + detail.slice(0, 400));
  }
  const data = await resp.json();
  const texto = String(data?.text || "").trim();

  // Trecho mudo não é erro: é trecho mudo. Devolver "" faz o front tratar
  // como silêncio em vez de despejar texto inventado na anamnese.
  if (!texto || pareceEco(texto) || pareceLoop(texto)) return "";
  return texto;
}

async function chamarOpenAI(
  key: string, model: string, maxTokens: number, temperature: number,
  system: string, user: string,
): Promise<Record<string, any>> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error("openai:" + detail.slice(0, 400));
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content?.trim() || "";
  if (!raw) throw new Error("vazio");
  return JSON.parse(raw);
}

function lista(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || "").trim()).filter(Boolean).slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
  const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  const MODEL_AUDIO = Deno.env.get("OPENAI_MODEL_AUDIO") || "gpt-4o-mini-transcribe";
  if (!OPENAI_KEY) return json({ error: "IA não configurada (falta OPENAI_API_KEY)." }, 500);

  // 1) Exige nutri autenticada.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);

  const ctype = req.headers.get("content-type") || "";

  /* ================= AÇÃO: TRANSCREVER (multipart) ================= */
  if (ctype.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }

    const gravacaoId = String(form.get("gravacao_id") || "").trim();
    const audio = form.get("audio");
    if (!gravacaoId) return json({ error: "Informe a gravação." }, 400);
    if (!(audio instanceof File)) return json({ error: "Não veio áudio." }, 400);
    if (audio.size === 0) return json({ error: "O áudio chegou vazio." }, 400);
    if (audio.size > MAX_AUDIO) {
      return json({ error: "Segmento de áudio grande demais. Grave trechos mais curtos." }, 413);
    }

    // O consentimento é pré-condição, não formalidade: sem a linha gravada
    // ANTES (e sendo dela, pela RLS), o áudio não é transcrito.
    const { data: grav, error: gErr } = await asCaller
      .from("consulta_gravacoes")
      .select("id,paciente_id,consentimento_em,segmentos,caracteres")
      .eq("id", gravacaoId)
      .maybeSingle();
    if (gErr) return json({ error: "Falha ao conferir o consentimento.", detail: gErr.message }, 502);
    if (!grav) return json({ error: "consentimento_ausente" }, 403);

    let texto = "";
    try {
      texto = await transcrever(OPENAI_KEY, audio, MODEL_AUDIO);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await asCaller.from("consulta_gravacoes")
        .update({ erro: msg.slice(0, 300) }).eq("id", gravacaoId);
      return json({ error: "Não foi possível transcrever este trecho.", detail: msg.slice(0, 200) }, 502);
    }

    // Contabiliza o segmento. Some o áudio daqui para frente — a partir
    // deste ponto só existe texto.
    await asCaller.from("consulta_gravacoes").update({
      segmentos: (grav.segmentos || 0) + 1,
      caracteres: (grav.caracteres || 0) + texto.length,
      erro: null,
    }).eq("id", gravacaoId);

    return json({ texto, modelo: MODEL_AUDIO });
  }

  /* ================= AÇÃO: NOTA (JSON) ================= */
  let body: { acao?: string; transcricao?: string; gravacao_id?: string; paciente_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (body.acao !== "nota") return json({ error: "acao_desconhecida" }, 400);

  const transcricao = String(body.transcricao || "").trim();
  if (transcricao.replace(/\s/g, "").length < 80) {
    return json({ error: "A transcrição está curta demais para virar nota." }, 400);
  }
  // Defesa em profundidade: a ação "nota" é chamável sozinha, e uma
  // transcrição que é só o vocabulário ecoado faria o modelo inventar uma
  // consulta inteira em cima de uma lista de termos.
  if (pareceEco(transcricao) || pareceLoop(transcricao)) {
    return json({
      error: "A gravação não trouxe fala reconhecível — o microfone pode não ter captado. " +
        "Nada foi aproveitado.",
    }, 400);
  }
  if (transcricao.length > MAX_TRANSCRICAO) {
    return json({
      error: `Transcrição muito longa (${transcricao.length} caracteres). O limite é ${MAX_TRANSCRICAO}.`,
    }, 400);
  }

  let out: Record<string, any>;
  try {
    out = await chamarOpenAI(
      OPENAI_KEY, MODEL, 2000, 0.2, SYSTEM_NOTA,
      "TRANSCRIÇÃO DA CONSULTA:\n\n" + transcricao,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Não foi possível montar a nota.", detail: msg.slice(0, 200) }, 502);
  }

  return json({
    queixa: String(out.queixa || "").trim(),
    nota: String(out.nota || "").trim(),
    combinados: lista(out.combinados, 15),
    duvidas: lista(out.duvidas, 15),
    modelo: MODEL,
  });
});
