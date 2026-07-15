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

// O modelo apenas EXTRAI os dados da imagem (tarefa que a visão faz bem).
// A comparação valor × referência é feita em CÓDIGO (determinística, exata),
// porque modelos pequenos erram a aritmética de limites.
const SYSTEM_PROMPT = `Você é um extrator de dados de exames laboratoriais (Brasil).
Recebe FOTO(S) de exames e devolve APENAS um JSON válido (sem texto fora do JSON).

Para CADA marcador legível, extraia com fidelidade o que está impresso — NÃO calcule,
NÃO classifique como normal/alterado, NÃO arredonde. Apenas transcreva.

Formato EXATO:
{
  "itens": [
    {
      "marcador": "Nome como aparece (ex.: Glicose em jejum)",
      "valor": <número, use ponto decimal; ex.: 5.9>,
      "unidade": "mg/dL",
      "vr_texto": "referência exatamente como impressa (ex.: 70-99, <5,7, >30) ou \\"\\" se ausente",
      "vr_min": <limite inferior numérico ou null>,
      "vr_max": <limite superior numérico ou null>
    }
  ],
  "observacoes": "notas curtas: itens ilegíveis, exame sem VR impresso, etc. (ou \\"\\")"
}

Regras de extração:
- Converta vírgula decimal para ponto (\\"5,9\\" -> 5.9).
- "VR < X"  -> vr_min: null, vr_max: X.
- "VR > X"  -> vr_min: X, vr_max: null.
- "VR A-B" ou "A – B" -> vr_min: A, vr_max: B.
- Se não houver VR impresso, deixe vr_texto \\"\\", vr_min e vr_max null (o sistema aplica a referência).
- NÃO invente valores nem referências. Se um valor estiver ilegível, não inclua o item e cite em "observacoes".
- Responda somente com o JSON.`;

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
  const sexo = pac.sexo === "M" ? "M" : "F";
  const ctxPaciente =
    `Paciente: ${pac.nome || "não informado"}` +
    `${pac.sexo ? ", sexo " + (pac.sexo === "M" ? "masculino" : "feminino") : ""}` +
    `${pac.idade != null ? ", " + pac.idade + " anos" : ""}.`;

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: `${ctxPaciente}\nExtraia os marcadores do(s) exame(s) na(s) imagem(ns) no JSON pedido.` },
    ...imagens.map((url) => ({ type: "image_url", image_url: { url, detail: "high" } })),
  ];

  // 3) Chama a OpenAI (extração em JSON).
  let extract: { itens?: ItemExtraido[]; observacoes?: string };
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0,
        response_format: { type: "json_object" },
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
    const raw = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) return json({ error: "A IA não retornou conteúdo." }, 502);
    extract = JSON.parse(raw);
  } catch (e) {
    return json({ error: "erro_rede_ia", detail: String(e).slice(0, 300) }, 502);
  }

  // 4) Classificação DETERMINÍSTICA (em código) — é aqui que garantimos a precisão.
  const itens = Array.isArray(extract.itens) ? extract.itens : [];
  const interpretacao = montarTexto(itens, sexo, extract.observacoes || "");
  return json({ ok: true, interpretacao, modelo: MODEL, marcadores: itens.length });
});

/* ============================================================
   Classificação determinística: usa a referência IMPRESSA (vr_min/
   vr_max extraídos). Se ausente, cai numa tabela de faixas adultas
   (por sexo). O modelo só transcreve — o veredito é do código.
   ============================================================ */
interface ItemExtraido {
  marcador?: string;
  valor?: number | string;
  unidade?: string;
  vr_texto?: string;
  vr_min?: number | null;
  vr_max?: number | null;
}

// Faixas de fallback quando o exame não traz VR impresso. Chave = trecho
// normalizado do nome do marcador. { min, max } ou por sexo { F, M }.
const REF_FALLBACK: Array<{ re: RegExp; ref: { min?: number; max?: number; F?: { min?: number; max?: number }; M?: { min?: number; max?: number } }; sig?: string }> = [
  { re: /glic(ose|emia).*(jejum)?|glicose/, ref: { min: 70, max: 99 }, sig: "controle glicêmico" },
  { re: /hemoglobina glicada|hba1c|glicada/, ref: { min: 4, max: 5.6 }, sig: "glicemia média ~3 meses" },
  { re: /insulina/, ref: { min: 2, max: 25 } },
  { re: /homa/, ref: { min: 0, max: 2.7 }, sig: "resistência à insulina" },
  { re: /colesterol total/, ref: { max: 190 } },
  { re: /\bhdl\b/, ref: { F: { min: 50 }, M: { min: 40 } }, sig: "colesterol protetor" },
  { re: /\bldl\b/, ref: { max: 130 } },
  { re: /triglicer/, ref: { max: 150 } },
  { re: /tgo|ast/, ref: { max: 34 } },
  { re: /tgp|alt/, ref: { max: 49 } },
  { re: /gama.?gt|ggt/, ref: { F: { max: 38 }, M: { max: 55 } } },
  { re: /ureia|uréia/, ref: { min: 15, max: 45 } },
  { re: /creatinina/, ref: { F: { min: 0.5, max: 0.9 }, M: { min: 0.7, max: 1.2 } } },
  { re: /[áa]cido [úu]rico/, ref: { F: { min: 2.4, max: 6 }, M: { min: 3.4, max: 7 } } },
  { re: /tsh/, ref: { min: 0.4, max: 4 }, sig: "função da tireoide" },
  { re: /t4 livre|t4l/, ref: { min: 0.7, max: 1.8 } },
  { re: /hemoglobina(?!.*glicada)/, ref: { F: { min: 12, max: 16 }, M: { min: 13, max: 17 } } },
  { re: /ferritina/, ref: { F: { min: 15, max: 150 }, M: { min: 30, max: 300 } }, sig: "estoque de ferro" },
  { re: /vitamina d|25.?oh/, ref: { min: 30, max: 100 } },
  { re: /b12|cobalamina/, ref: { min: 200, max: 900 } },
  { re: /folato|[áa]cido f[óo]lico/, ref: { min: 3, max: 20 } },
  { re: /c[áa]lcio/, ref: { min: 8.5, max: 10.5 } },
  { re: /magn[ée]sio/, ref: { min: 1.6, max: 2.6 } },
  { re: /pcr|prote[íi]na c reativa/, ref: { max: 3 }, sig: "inflamação" },
  { re: /albumina/, ref: { min: 3.5, max: 5.2 } },
];

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

function refFallback(nome: string, sexo: string): { min?: number; max?: number } | null {
  const s = nome.toLowerCase();
  for (const e of REF_FALLBACK) {
    if (e.re.test(s)) {
      const r = e.ref as Record<string, unknown>;
      if (r.min != null || r.max != null) return { min: r.min as number, max: r.max as number };
      const bysex = (r[sexo] || r.F || r.M) as { min?: number; max?: number };
      return bysex || null;
    }
  }
  return null;
}

// veredito: "alto" | "baixo" | "normal"
function classificar(valor: number, min: number | null | undefined, max: number | null | undefined): string {
  if (max != null && valor > max) return "alto";
  if (min != null && valor < min) return "baixo";
  return "normal";
}

function refLabel(min: number | null | undefined, max: number | null | undefined): string {
  if (min != null && max != null) return `${min}–${max}`;
  if (max != null) return `≤ ${max}`;
  if (min != null) return `≥ ${min}`;
  return "—";
}

function montarTexto(itens: ItemExtraido[], sexo: string, observacoes: string): string {
  const fora: string[] = [];
  const dentro: string[] = [];
  let semRef = 0;

  for (const it of itens) {
    const nome = (it.marcador || "").trim();
    const val = toNum(it.valor);
    if (!nome || val == null) continue;

    let min = it.vr_min ?? null;
    let max = it.vr_max ?? null;
    let refFonte = it.vr_texto && String(it.vr_texto).trim() ? String(it.vr_texto).trim() : "";

    // Sem referência impressa? aplica fallback por nome.
    if (min == null && max == null) {
      const fb = refFallback(nome, sexo);
      if (fb) { min = fb.min ?? null; max = fb.max ?? null; refFonte = refLabel(min, max) + " (ref. do sistema)"; }
      else { semRef++; }
    }
    if (!refFonte) refFonte = refLabel(min, max);

    const un = it.unidade ? " " + it.unidade : "";
    if (min == null && max == null) {
      dentro.push(`- ${nome}: ${val}${un} (sem referência para comparar)`);
      continue;
    }
    const stat = classificar(val, min, max);
    const linha = `- ${nome}: ${val}${un} (ref: ${refFonte})`;
    if (stat === "alto") fora.push(`${linha} — ALTO`);
    else if (stat === "baixo") fora.push(`${linha} — BAIXO`);
    else dentro.push(linha);
  }

  const partes: string[] = [];
  const resumo = fora.length
    ? `${fora.length} marcador(es) fora da referência e ${dentro.length} dentro. Priorize os itens alterados abaixo.`
    : (dentro.length ? "Todos os marcadores avaliados estão dentro da referência." : "Não consegui ler marcadores com segurança nesta imagem.");
  partes.push("Resumo:\n" + resumo);
  partes.push("Fora da referência:\n" + (fora.length ? fora.join("\n") : "- Tudo dentro da referência."));
  if (dentro.length) partes.push("Dentro da referência:\n" + dentro.join("\n"));
  if (semRef > 0 || (observacoes && observacoes.trim())) {
    const obs = [observacoes && observacoes.trim() ? observacoes.trim() : "", semRef ? `${semRef} marcador(es) sem referência no exame — comparados por faixa adulta usual ou deixados sem veredito.` : ""].filter(Boolean).join(" ");
    partes.push("Observações:\n- " + obs);
  }
  partes.push("Isto é um apoio à leitura — confirme sempre no laudo e use seu julgamento clínico.");
  return partes.join("\n\n");
}
