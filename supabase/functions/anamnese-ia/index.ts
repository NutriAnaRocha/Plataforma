// ============================================================
//  Edge Function: anamnese-ia
//  Dois modos, uma função (mesmo boilerplate de gerar-orientacao):
//
//  modo "texto"   → corrige o português da anamnese digitada às pressas.
//                   Corrige a FORMA, nunca o CONTEÚDO: não inventa sintoma,
//                   não apaga informação, não mexe em número/dose/unidade.
//
//  modo "conduta" → lê a ficha do paciente (com o JWT da nutri, RLS aplica),
//                   casa a anamnese contra os protocolos da Biblioteca Clínica
//                   dela (ic_protocolos_meus) e devolve um RASCUNHO de
//                   diagnóstico nutricional + conduta + metas.
//
//  A IA é copiloto: sugere, nunca decide. A nutri revisa e valida antes de
//  salvar (escopo CFN 856/2026). Nada é gravado por esta função.
//
//  OpenAI, gpt-4o-mini (secret OPENAI_API_KEY; modelo via OPENAI_MODEL).
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

const MAX_TEXTO = 6000;      // anamnese digitada de uma consulta cabe folgado
const MAX_PROTOCOLOS = 3;    // quantos protocolos entram no prompt da conduta

/* ============================================================
   MODO "texto" — revisão de português
   ============================================================ */

// O risco aqui não é escrever feio: é a IA "melhorar" o registro e alterar
// o fato clínico. Por isso as proibições vêm antes das instruções, e tudo
// que for ambíguo volta em "duvidas" em vez de virar chute.
const SYSTEM_TEXTO = `Você revisa o texto de PRONTUÁRIO escrito por uma nutricionista brasileira durante o atendimento — digitado com pressa, com erro de digitação e abreviação de consultório.

Sua tarefa é corrigir a FORMA do texto. O CONTEÚDO é sagrado.

PROIBIDO (isto é mais importante que qualquer outra regra):
- Inventar, deduzir ou acrescentar qualquer informação clínica que não esteja no texto.
- Remover ou resumir informação que está no texto. Tudo que entrou tem que sair.
- Alterar número, dose, medida, unidade, data, frequência ou nome de medicamento/exame/suplemento.
- Interpretar, diagnosticar, opinar ou sugerir conduta. Você não é o clínico aqui.
- Trocar termo clínico por sinônimo leigo (ou o contrário).

PERMITIDO:
- Ortografia, acentuação, concordância, regência, pontuação e maiúsculas.
- Separar em parágrafos e frases legíveis quando o texto vier em bloco corrido.
- Expandir abreviação de consultório APENAS quando for inequívoca no contexto
  (ex.: "pct" → "paciente", "rlta" → "relata", "HF" → "história familiar",
  "c/" → "com", "s/" → "sem", "2x" → "2 vezes", "mto" → "muito").
- Se a abreviação ou a palavra estiver ambígua, MANTENHA COMO ESTÁ e registre em "duvidas".

Estilo: mantenha o registro de prontuário, em terceira pessoa, objetivo e seco.
Não deixe o texto mais bonito, mais gentil nem mais longo. Sem markdown, sem emoji.

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{
  "texto_corrigido": "o texto revisado, com quebras de linha reais",
  "mudancas": [ { "de": "trecho original", "para": "trecho corrigido", "motivo": "ortografia|abreviação|pontuação|concordância" } ],
  "duvidas": ["trecho que você não teve certeza do que significa e deixou intacto"]
}

Em "mudancas", liste no máximo 20 trocas — as mais relevantes. Se o texto já estiver
correto, devolva "texto_corrigido" idêntico ao original e "mudancas" vazio.`;

/* ============================================================
   MODO "conduta" — diagnóstico nutricional + conduta
   ============================================================ */

const SYSTEM_CONDUTA = `Você é copiloto clínico de uma nutricionista brasileira (saúde da mulher e fertilidade). Fala COM A NUTRICIONISTA, colega de profissão — não com o paciente.

A partir dos dados do paciente e dos PROTOCOLOS DA BIBLIOTECA CLÍNICA dela (quando houver),
escreve um RASCUNHO de raciocínio clínico para ela revisar, corrigir e assinar.

Regras invioláveis:
- Use como fonte de verdade APENAS os dados do paciente que estão no contexto. Se um peso,
  exame ou informação não está lá, NÃO invente número plausível — diga que falta, no campo
  "dados_faltantes".
- Quando houver protocolos da biblioteca no contexto, ANCORE a conduta neles: eles são o
  jeito de trabalhar dela. Cite qual você usou.
- Fique no ESCOPO do nutricionista: alimentação, hábitos, rotina, sono, hidratação,
  movimento, suplementação de nutrientes. NÃO prescreva medicamento nem dose de fármaco.
- Suplemento: pode indicar o nutriente e o racional, mas deixe a dose como decisão dela,
  a não ser que o protocolo em contexto traga a dose.
- NÃO prometa cura nem resultado garantido. NÃO invente referência, estudo ou percentual.
  Nada que viole o Código de Ética do nutricionista (CFN).
- Diga onde termina o escopo: se houver sinal de alerta que peça médico, coloque em
  "sinais_alerta".
- Português do Brasil, tom profissional e seco, texto de prontuário. Sem markdown, sem emoji.

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{
  "diagnostico_nutricional": "2 a 4 frases: o quadro nutricional em linguagem clínica",
  "conduta": ["conduta 1", "conduta 2"],
  "metas": ["meta objetiva e verificável até o retorno"],
  "exames_sugeridos": ["exame a considerar (ou lista vazia)"],
  "dados_faltantes": ["o que falta na ficha para fechar melhor o raciocínio"],
  "sinais_alerta": "quando encaminhar ao médico ou a outro profissional (ou \\"\\")",
  "protocolos_usados": ["nome exato do protocolo do contexto que embasou a conduta"]
}

3 a 6 itens em "conduta", 2 a 4 em "metas". Itens concretos e aplicáveis, não genéricos.

"protocolos_usados" é OBRIGATÓRIO sempre que você aproveitar qualquer coisa de um protocolo
do contexto — copie o nome exatamente como veio em "### Protocolo: ". Só deixe a lista vazia
se realmente nenhum protocolo influenciou a conduta.`;

/* ---------- Normalização e casamento com a Biblioteca Clínica ----------
   Mesma técnica de prototipo/assets/js/ic-link.js: normaliza (sem acento,
   sem pontuação, sem conectivo) e casa por termo inteiro. O casamento é
   feito AQUI, em código — não custa token e é determinístico. */
const STOP: Record<string, number> = { de: 1, da: 1, do: 1, e: 1, a: 1, o: 1, em: 1, com: 1 };

function norm(s: unknown): string {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t && !STOP[t])
    .join(" ");
}

// Termo inteiro dentro do texto normalizado (evita "gase" casar em "gaseificado").
function contem(textoNorm: string, termo: string): boolean {
  const t = norm(termo);
  if (!t || t.length < 4) return false;   // termo curto demais gera falso positivo
  return new RegExp("(^|\\s)" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|\\s)").test(textoNorm);
}

interface Protocolo {
  id: string; nome: string; slug: string;
  sinonimos?: string[]; sinais_sintomas?: string[];
  objetivo_clinico?: string; estrategia?: string;
  nutrientes?: unknown; quando_encaminhar?: string; atencao?: string;
}

// Pontua: nome do protocolo vale mais que sinônimo, que vale mais que sintoma.
function ranquear(protocolos: Protocolo[], texto: string): Protocolo[] {
  const tn = norm(texto);
  if (!tn) return [];
  return protocolos
    .map((p) => {
      let score = contem(tn, p.nome) ? 3 : 0;
      for (const s of p.sinonimos || []) if (contem(tn, s)) score += 2;
      for (const s of p.sinais_sintomas || []) if (contem(tn, s)) score += 1;
      return { p, score };
    })
    // Score 2 é o piso de propósito: um único sinal genérico ("constipação",
    // "fadiga") casa com meio mundo de protocolo. Exigir nome, sinônimo ou
    // dois sintomas mantém só o que tem cara de ser o quadro.
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PROTOCOLOS)
    .map((x) => x.p);
}

function protocoloTxt(p: Protocolo): string {
  const L = [`### Protocolo: ${p.nome}`];
  if (p.objetivo_clinico) L.push(`Objetivo clínico: ${p.objetivo_clinico}`);
  if (p.estrategia) L.push(`Estratégia nutricional: ${p.estrategia}`);
  if (Array.isArray(p.nutrientes) && p.nutrientes.length) {
    L.push(`Nutrientes: ${JSON.stringify(p.nutrientes).slice(0, 900)}`);
  }
  if (p.quando_encaminhar) L.push(`Quando encaminhar: ${p.quando_encaminhar}`);
  if (p.atencao) L.push(`Atenção: ${p.atencao}`);
  return L.join("\n");
}

/* ---------- Contexto do paciente ----------
   Espelha resumoPaciente() de assistente-ia, MAIS questionarios (a anamnese
   que a própria paciente respondeu no portal) e prontuario.anamnese — que
   são exatamente onde mora a informação que embasa a conduta. */
function resumoPaciente(p: Record<string, any>): string {
  const L: string[] = [];
  const add = (label: string, v: unknown) => {
    if (v === null || v === undefined || v === "") return;
    L.push(`- ${label}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  };
  add("Idade", p.idade);
  add("Sexo", p.sexo);
  add("Objetivo", p.objetivo);
  add("Peso atual (kg)", p.peso_atual);
  add("Peso inicial (kg)", p.peso_inicial);
  add("Meta de peso (kg)", p.meta);
  add("Altura (m)", p.altura);
  add("IMC", p.imc);
  add("Restrições e alergias", p.restricoes);
  add("Anamnese inicial", p.anamnese);
  add("Observações", p.observacoes);
  add("Tags", Array.isArray(p.tags) && p.tags.length ? p.tags.join(", ") : null);

  const jsonBlock = (label: string, v: unknown, max = 1800) => {
    if (!v) return;
    let s: string;
    try { s = JSON.stringify(v); } catch { return; }
    if (!s || s === "[]" || s === "{}" || s === '{"labels":[],"peso":[]}') return;
    if (s.length > max) s = s.slice(0, max) + "…(truncado)";
    L.push(`- ${label}: ${s}`);
  };

  // Anamnese respondida pela paciente no portal + anamneses de retorno.
  if (Array.isArray(p.questionarios) && p.questionarios.length) {
    const recentes = p.questionarios.slice(-3);
    jsonBlock("Questionários respondidos (anamnese do portal e retornos)", recentes, 3000);
  }
  // Bloco clínico estruturado do prontuário (doenças, medicamentos, hábitos…).
  if (p.prontuario && typeof p.prontuario === "object") {
    jsonBlock("Anamnese estruturada (prontuário)", (p.prontuario as any).anamnese, 2500);
    jsonBlock("Evoluções clínicas anteriores", (p.prontuario as any).evolucao, 1500);
  }
  jsonBlock("Antropometria", p.antropometria, 1200);
  jsonBlock("Cálculos energéticos (TMB/GET/VET)", p.calculos, 800);
  jsonBlock("Exames", p.exames, 2500);
  jsonBlock("Peso ao longo do tempo", p.evolucao, 800);

  return L.join("\n");
}

// Todo texto livre do paciente que serve para casar com os protocolos.
function textoClinico(p: Record<string, any>): string {
  const partes = [p.anamnese, p.restricoes, p.observacoes, p.objetivo];
  if (Array.isArray(p.tags)) partes.push(p.tags.join(" "));
  try {
    if (Array.isArray(p.questionarios)) partes.push(JSON.stringify(p.questionarios.slice(-3)));
    if (p.prontuario) partes.push(JSON.stringify((p.prontuario as any).anamnese || ""));
  } catch { /* ignora jsonb malformado */ }
  return partes.filter(Boolean).join(" \n ");
}

/* ---------- Sanitização da saída ---------- */
function str(v: unknown, max = 4000): string {
  return String(v == null ? "" : v).trim().slice(0, max);
}
function lista(v: unknown, maxItens = 8, maxChar = 400): string[] {
  return (Array.isArray(v) ? v : [])
    .map((i) => str(typeof i === "string" ? i : JSON.stringify(i), maxChar))
    .filter(Boolean)
    .slice(0, maxItens);
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
  let body: { modo?: string; texto?: string; paciente_id?: string; campo?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const modo = body.modo === "conduta" ? "conduta" : "texto";

  /* ---------------- MODO TEXTO ---------------- */
  if (modo === "texto") {
    const texto = String(body.texto || "").trim();
    if (!texto) return json({ error: "Não há texto para revisar." }, 400);
    if (texto.length > MAX_TEXTO) {
      return json({ error: `Texto muito longo (${texto.length} caracteres). O limite é ${MAX_TEXTO}.` }, 400);
    }

    // Orçamento de saída proporcional: o texto corrigido tem o tamanho do
    // original, e as mudanças vêm por cima. ~4 chars por token, com folga.
    const maxTokens = Math.min(4000, Math.max(600, Math.ceil(texto.length / 4) * 3));

    const rotulo = body.campo === "restricoes" ? "restrições e alergias"
      : body.campo === "observacoes" ? "observações gerais"
      : "anamnese";

    let out: Record<string, any>;
    try {
      out = await chamarOpenAI(OPENAI_KEY, MODEL, maxTokens, 0.1, SYSTEM_TEXTO,
        `Campo do prontuário: ${rotulo}.\nTexto original (revise sem alterar o conteúdo):\n\n${texto}`);
    } catch (e) {
      const m = String(e);
      if (m.startsWith("Error: openai:")) return json({ error: "Falha na IA (OpenAI).", detail: m.slice(0, 500) }, 502);
      return json({ error: "erro_rede_ia", detail: m.slice(0, 300) }, 502);
    }

    const corrigido = str(out.texto_corrigido, MAX_TEXTO * 2);
    if (!corrigido) return json({ error: "A IA não retornou o texto revisado." }, 502);

    const mudancas = (Array.isArray(out.mudancas) ? out.mudancas : [])
      .map((m: any) => ({
        de: str(m?.de, 200),
        para: str(m?.para, 200),
        motivo: str(m?.motivo, 60),
      }))
      .filter((m: any) => m.de && m.para && m.de !== m.para)
      .slice(0, 20);

    return json({
      ok: true,
      modo: "texto",
      texto_original: texto,
      texto_corrigido: corrigido,
      mudancas,
      duvidas: lista(out.duvidas, 8, 200),
      modelo: MODEL,
    });
  }

  /* ---------------- MODO CONDUTA ---------------- */
  const pid = String(body.paciente_id || "").trim();
  if (!pid) return json({ error: "Informe o paciente." }, 400);

  // Busca com o JWT da nutri: a RLS garante que ela só vê os próprios.
  const { data: pac, error: pacErr } = await asCaller
    .from("pacientes").select("*").eq("id", pid).maybeSingle();
  if (pacErr) return json({ error: "Falha ao carregar o paciente.", detail: pacErr.message }, 502);
  if (!pac) return json({ error: "Paciente não encontrado." }, 404);

  const clinico = textoClinico(pac);
  if (clinico.replace(/\s/g, "").length < 40) {
    return json({
      error: "Ainda não há anamnese suficiente para sugerir uma conduta. " +
        "Escreva a anamnese inicial (ou peça a anamnese do portal à paciente) e tente de novo.",
    }, 400);
  }

  // Biblioteca Clínica da nutri (a view já respeita a RLS dela).
  let protocolos: Protocolo[] = [];
  const { data: prots } = await asCaller
    .from("ic_protocolos_meus")
    .select("id,nome,slug,sinonimos,sinais_sintomas,objetivo_clinico,estrategia,nutrientes,quando_encaminhar,atencao");
  if (Array.isArray(prots)) protocolos = ranquear(prots as Protocolo[], clinico);

  const contexto = resumoPaciente(pac);
  let userPrompt = `DADOS DO PACIENTE (fonte de verdade — não invente nada além disto):\n${contexto}\n\n`;
  if (protocolos.length) {
    userPrompt += "PROTOCOLOS DA BIBLIOTECA CLÍNICA DA NUTRICIONISTA (ancore a conduta neles):\n" +
      protocolos.map(protocoloTxt).join("\n\n") + "\n\n";
  } else {
    userPrompt += "Nenhum protocolo da biblioteca casou com este quadro. " +
      "Baseie-se apenas nos dados do paciente e em consenso de boas práticas, e deixe " +
      "\"protocolos_usados\" vazio.\n\n";
  }
  userPrompt += "Escreva o rascunho de diagnóstico nutricional e conduta, no JSON pedido.";

  let out: Record<string, any>;
  try {
    out = await chamarOpenAI(OPENAI_KEY, MODEL, 1200, 0.3, SYSTEM_CONDUTA, userPrompt);
  } catch (e) {
    const m = String(e);
    if (m.startsWith("Error: openai:")) return json({ error: "Falha na IA (OpenAI).", detail: m.slice(0, 500) }, 502);
    return json({ error: "erro_rede_ia", detail: m.slice(0, 300) }, 502);
  }

  // Só devolve protocolo que existe de verdade no contexto — se o modelo
  // citar um nome que não passamos, ele não sai daqui.
  const ref = (p: Protocolo) => ({ id: p.id, nome: p.nome, slug: p.slug });
  const usados = lista(out.protocolos_usados, 3, 120)
    .map((n) => protocolos.find((p) => norm(p.nome) === norm(n)))
    .filter(Boolean)
    .map((p) => ref(p!));

  return json({
    ok: true,
    modo: "conduta",
    diagnostico_nutricional: str(out.diagnostico_nutricional, 1500),
    conduta: lista(out.conduta, 8, 500),
    metas: lista(out.metas, 6, 300),
    exames_sugeridos: lista(out.exames_sugeridos, 8, 160),
    dados_faltantes: lista(out.dados_faltantes, 6, 200),
    sinais_alerta: str(out.sinais_alerta, 800),
    protocolos_usados: usados,
    protocolos_consultados: protocolos.map(ref),
    modelo: MODEL,
  });
});
