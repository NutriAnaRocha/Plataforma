// ============================================================
//  Edge Function: analisar-prato
//  A PACIENTE fotografa o prato; a IA estima calorias e macros,
//  aponta o que está fora do combinado e o que está bom.
//
//  Fluxo: o portal sobe a foto para o bucket privado 'pratos'
//  ('<paciente_id>/<uuid>.jpg') e chama esta função com o caminho.
//  Aqui a foto é baixada com service_role, mandada para a OpenAI em
//  base64, e o resultado é GRAVADO no servidor.
//
//  Por que a gravação é aqui e não no cliente: se a paciente pudesse
//  dar insert em pratos_registrados, ela digitaria os próprios números
//  e a nutri leria como estimativa da IA. Ver migração 0050.
//
//  ESCOPO: estimativa a partir de uma foto. Não é avaliação nutricional
//  nem prescrição — quem interpreta é a nutricionista (Res. CFN 856/2026).
//  O prompt proíbe diagnóstico, dieta, promessa e julgamento moral.
//
//  Chave da OpenAI no secret OPENAI_API_KEY. Modelo via OPENAI_MODEL
//  (padrão gpt-4o-mini, que enxerga imagem).
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

// Teto diário por paciente. Não é regra clínica — é freio de custo: a
// conta da OpenAI é da Ana, e um toque repetido no botão não pode virar
// uma fatura. 20 pratos/dia é folgado para uso honesto.
const MAX_POR_DIA = 20;

const SYSTEM_PROMPT = `Você analisa FOTOS DE PRATOS DE COMIDA para o portal de uma nutricionista brasileira.
Fala direto com a paciente, em português do Brasil, com tom acolhedor e adulto.

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{
  "tem_comida": true,
  "descricao": "frase curta do que está no prato",
  "itens": [{ "nome": "arroz integral", "porcao": "4 colheres de sopa", "kcal": 160 }],
  "kcal": 520, "ptn_g": 30, "cho_g": 55, "lip_g": 18,
  "alertas": ["o que está fora do combinado"],
  "pontos_bons": ["o que está bem feito"],
  "confianca": "alta",
  "comentario": "1 ou 2 frases fechando"
}

Como estimar:
- Use referências de tamanho na foto (talher, prato, copo, mão) para julgar a porção. Diga a porção em medida caseira, como a paciente pensa.
- "confianca": "alta" quando dá para ver bem os alimentos e a porção; "media" quando a porção é incerta ou há molho/preparo escondido; "baixa" quando a foto está escura, cortada, muito de longe, ou o prato está misturado a ponto de não dar para separar.
- kcal e macros são do PRATO INTEIRO, em números inteiros. A soma dos itens deve bater aproximadamente com o total.
- Preparo importa: frito, empanado, com molho cremoso ou queijo derretido mudam muito a estimativa. Se não der para saber, assuma o preparo mais comum no Brasil e rebaixe a confiança.

"alertas" — o que está fora do combinado (0 a 4 itens, os mais relevantes):
- Compare com o plano e a meta que vierem no contexto. Se não vier plano, compare com boas práticas.
- Vale apontar: proteína baixa, ausência de vegetais/salada, porção de carboidrato bem acima do combinado, fritura/ultraprocessado, refrigerante ou suco adoçado, prato muito acima ou muito abaixo da meta de calorias da refeição.
- Escreva o que fazer da próxima vez, concreto: "acrescente uma proteína — um ovo ou um filé pequeno já resolve".
- Se estiver tudo certo, devolva [].

"pontos_bons" — 1 a 3 itens. SEMPRE encontre algo verdadeiro para reconhecer. Nunca devolva [] se o prato tem comida de verdade.

Proibido:
- Diagnosticar, prescrever dieta, mandar cortar refeição, sugerir jejum, suplemento, medicamento ou exame.
- Falar em "comida boa/ruim", "proibido", "você errou", "pecado", "compensar", "queimar". Sem culpa e sem moralizar comida.
- Prometer resultado, peso ou prazo.
- Inventar precisão que a foto não dá. Na dúvida, arredonde e baixe a confiança.

Sobre "tem_comida":
- Se houver QUALQUER alimento ou bebida na imagem, "tem_comida" é true — sempre, mesmo que a foto esteja ruim, escura, cortada, ou que você não consiga identificar tudo. Foto ruim de comida é comida: estime o que der e use "confianca": "baixa".
- "tem_comida" só é false quando não há alimento nenhum na imagem: uma pessoa, um animal, uma paisagem, um documento, uma tela, um objeto. Nesse caso devolva exatamente:
{ "tem_comida": false, "descricao": "o que a imagem parece ser", "itens": [], "kcal": null, "ptn_g": null, "cho_g": null, "lip_g": null, "alertas": [], "pontos_bons": [], "confianca": "baixa", "comentario": "" }`;

/** ArrayBuffer -> base64 em blocos. O spread de um Uint8Array grande
 *  (String.fromCharCode(...arr)) estoura a pilha em foto de celular. */
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(bin);
}

function n(v: unknown): number | null {
  const x = typeof v === "string" ? parseFloat(v) : v;
  return typeof x === "number" && isFinite(x) && x >= 0 ? Math.round(x) : null;
}

function listaDeTextos(v: unknown, max: number): string[] {
  return (Array.isArray(v) ? v : [])
    .map((s) => String(s == null ? "" : s).trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Resumo do plano e da meta para a IA ter com o que comparar.
 *  Sem isto ela só sabe dizer "coma mais salada" — o valor está em
 *  medir o prato contra o que a nutri combinou com ESTA paciente. */
function contexto(pac: Record<string, unknown>, refeicao: string): string {
  const linhas: string[] = [];
  const calc = (pac.calculos || null) as Record<string, unknown> | null;
  if (calc && calc.vet) {
    const m = (calc.macros || null) as Record<string, Record<string, number>> | null;
    linhas.push(
      `Meta do dia: ${calc.vet} kcal` +
      (m ? ` (proteína ${m.ptn?.g} g, carboidrato ${m.cho?.g} g, gordura ${m.lip?.g} g)` : "") +
      (calc.objetivoNome ? `. Objetivo: ${calc.objetivoNome}.` : "."),
    );
  }

  // A refeição correspondente do plano liberado, quando existe.
  const plano = (pac.plano || {}) as Record<string, unknown>;
  let refs = (plano.refeicoes || []) as Array<Record<string, unknown>>;
  const planos = plano.planos as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(planos)) {
    const pub = planos.find((p) => p && p.publicado);
    if (pub && Array.isArray(pub.refeicoes)) refs = pub.refeicoes as Array<Record<string, unknown>>;
  }
  const alvo = refs.find((r) =>
    String(r?.nome || "").toLowerCase().includes(refeicao.toLowerCase().split(" ")[0])
  );
  if (alvo) {
    const itens = (alvo.itens as Array<Record<string, unknown>> || [])
      .map((it) => {
        if (typeof it === "string") return it;
        const q = it.medida && it.medida !== "grama"
          ? `${it.qtd ?? ""} ${it.medida}`
          : it.gramas != null ? `${it.gramas} g` : "";
        return `${it.alimento || it.nome || ""}${q ? " — " + q : ""}`;
      })
      .filter(Boolean);
    if (itens.length) {
      linhas.push(`No plano, "${alvo.nome}" é: ${itens.join("; ")}.`);
    }
  }
  return linhas.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
  const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  if (!OPENAI_KEY) return json({ error: "IA não configurada (falta OPENAI_API_KEY)." }, 500);

  // 1) Exige sessão válida.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "missing_auth" }, 401);
  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes.user) return json({ error: "invalid_token" }, 401);
  const uid = userRes.user.id;

  // 2) Corpo.
  let body: { foto_path?: string; refeicao?: string; observacao?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const fotoPath = String(body.foto_path || "").trim();
  const refeicao = String(body.refeicao || "").trim().slice(0, 40) || "Refeição";
  const observacao = String(body.observacao || "").trim().slice(0, 400);
  if (!/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/.test(fotoPath)) {
    return json({ error: "caminho_invalido" }, 400);
  }
  const pacienteId = fotoPath.split("/")[0];

  const admin = createClient(SUPABASE_URL, SERVICE);

  // 3) A ficha tem de ser de quem está chamando. A checagem é aqui, com
  //    service_role, porque daqui para a frente o RLS não protege mais nada.
  const { data: pac } = await admin
    .from("pacientes")
    .select("id,user_id,nutricionista_id,plano,calculos")
    .eq("id", pacienteId)
    .maybeSingle();
  if (!pac) return json({ error: "ficha_nao_encontrada" }, 404);
  if (pac.user_id !== uid) return json({ error: "nao_e_sua_ficha" }, 403);

  // 4) Freio de custo.
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("pratos_registrados")
    .select("id", { count: "exact", head: true })
    .eq("paciente_id", pacienteId)
    .gte("criado_em", desde);
  if ((count || 0) >= MAX_POR_DIA) {
    return json({ error: "limite_diario", detail: `Limite de ${MAX_POR_DIA} análises por dia.` }, 429);
  }

  // 5) Baixa a foto do bucket privado.
  const { data: arquivo, error: dlErr } = await admin.storage.from("pratos").download(fotoPath);
  if (dlErr || !arquivo) return json({ error: "foto_nao_encontrada" }, 404);
  const buf = await arquivo.arrayBuffer();
  if (buf.byteLength > 6 * 1024 * 1024) return json({ error: "foto_muito_grande" }, 413);
  const dataUrl = `data:${arquivo.type || "image/jpeg"};base64,${toBase64(buf)}`;

  // 6) Chama a OpenAI.
  const ctx = contexto(pac as Record<string, unknown>, refeicao);
  const userTexto =
    `Refeição: ${refeicao}.\n` +
    (observacao ? `A paciente escreveu: "${observacao}".\n` : "") +
    (ctx ? `\nContexto do acompanhamento dela:\n${ctx}\n` : "") +
    `\nAnalise a foto do prato e devolva o JSON pedido.`;

  let out: Record<string, unknown>;
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        temperature: 0.2, // estimativa quer estabilidade, não criatividade
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userTexto },
              // "auto" e não "low": em "low" a imagem cai para 512px e a
              // porção vira chute. A foto já chega com 1024px de lado, e
              // o custo por imagem no mini é fração de centavo.
              { type: "image_url", image_url: { url: dataUrl, detail: "auto" } },
            ],
          },
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

  // 7) Não era comida: apaga a foto e devolve sem gravar linha. Guardar
  //    isso só sujaria a ficha e a paciente pagaria com confusão.
  //
  //    O booleano do modelo sozinho não serve: num teste com uma feijoada
  //    ele devolveu descricao "prato de feijoada" E tem_comida=false, o que
  //    teria apagado a foto de um prato perfeitamente válido. Então a
  //    recusa exige as duas coisas — disse que não é comida E não trouxe
  //    conteúdo nenhum. Conteúdo vence flag.
  const itensBrutos = Array.isArray(out.itens) ? out.itens : [];
  const semConteudo = itensBrutos.length === 0 && n(out.kcal) === null;
  if (out.tem_comida === false && semConteudo) {
    await admin.storage.from("pratos").remove([fotoPath]);
    return json({
      ok: false,
      nao_e_comida: true,
      descricao: String(out.descricao || "").trim(),
      error: "Não consegui reconhecer um prato de comida nessa foto. Tente de novo, com o prato inteiro à vista e boa luz.",
    }, 200);
  }

  // 8) Sanitiza e grava.
  const itens = itensBrutos
    .map((i: Record<string, unknown>) => ({
      nome: String(i?.nome || "").trim(),
      porcao: String(i?.porcao || "").trim(),
      kcal: n(i?.kcal),
    }))
    .filter((i) => i.nome)
    .slice(0, 12);

  const confianca = ["alta", "media", "baixa"].includes(String(out.confianca))
    ? String(out.confianca)
    : "media";

  const linha = {
    paciente_id: pacienteId,
    foto_path: fotoPath,
    refeicao,
    observacao: observacao || null,
    kcal: n(out.kcal),
    ptn_g: n(out.ptn_g),
    cho_g: n(out.cho_g),
    lip_g: n(out.lip_g),
    itens,
    alertas: listaDeTextos(out.alertas, 4),
    pontos_bons: listaDeTextos(out.pontos_bons, 3),
    confianca,
    modelo: MODEL,
  };

  const { data: gravado, error: insErr } = await admin
    .from("pratos_registrados")
    .insert(linha)
    .select("*")
    .single();
  if (insErr) return json({ error: "falha_ao_gravar", detail: insErr.message }, 500);

  return json({
    ok: true,
    prato: gravado,
    descricao: String(out.descricao || "").trim(),
    comentario: String(out.comentario || "").trim(),
  });
});
